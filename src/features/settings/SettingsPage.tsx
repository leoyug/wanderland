import { RiInformationLine, RiRefreshLine, RiShieldCheckLine } from "@remixicon/react";
import { rise } from "cube-motion";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { endpointPermissionPattern, defaultAiSettings } from "@/src/ai/config";
import type { AiSettings, AiSettingsView, AiTaskSummary, ApiKeyStorage } from "@/src/ai/types";
import { aiProviderPresets } from "@/src/ai/presets";
import type { ExtensionRequest } from "@/src/capture/types";
import { AppShell, type SettingsSection } from "@/src/components/layout/AppShell";
import { Button } from "@/src/components/ui/Button";
import { ConfirmDialog } from "@/src/components/ui/ConfirmDialog";
import { Field, Input } from "@/src/components/ui/Field";
import { SelectMenu } from "@/src/components/ui/SelectMenu";
import { Switch } from "@/src/components/ui/Switch";
import { useToast } from "@/src/components/ui/Toast";
import { createBackup, parseBackup, restoreBackup, type Backup } from "@/src/db/backup";
import { inspirationRepository, type DeletedSavedItem } from "@/src/db/repository";

const MAX_BACKUP_BYTES = 100 * 1024 * 1024;
const emptySummary: AiTaskSummary = { pending: 0, running: 0, failed: 0, complete: 0 };
const apiKeyStorageOptions = [
  { value: "session" as const, label: "当前会话", description: "退出浏览器后需重新填写。" },
  { value: "local" as const, label: "保存在本地", description: "不会同步，但客户端 Key 仍可被读取。" },
];
const aiProviderOptions = [
  { value: "openai" as const, label: "OpenAI" },
  { value: "deepseek" as const, label: "DeepSeek" },
  { value: "custom" as const, label: "自定义服务" },
];

function sendExtensionMessage<T>(request: ExtensionRequest) {
  if (typeof browser === "undefined" || !browser.runtime?.sendMessage) {
    return Promise.reject(new Error("AI 设置需要在已加载的浏览器扩展页面中使用。"));
  }
  return browser.runtime.sendMessage(request) as Promise<T>;
}

function SettingsHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <header className="settings-page-header"><div><h1>{title}</h1><p>{description}</p></div>{action}</header>;
}

function SettingsSectionHeading({ title, description }: { title: string; description: string }) {
  return <div className="settings-section-heading"><h2>{title}</h2><p>{description}</p></div>;
}

function SettingsCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`settings-card ${className}`.trim()}>{children}</div>;
}

function SettingsRow({ title, description, control, children }: { title: string; description?: string; control?: ReactNode; children?: ReactNode }) {
  return <div className="settings-card-row">
    <div className="settings-card-row-copy"><strong>{title}</strong>{description ? <span>{description}</span> : null}</div>
    {control ? <div className="settings-card-row-control">{control}</div> : null}
    {children ? <div className="settings-card-row-detail">{children}</div> : null}
  </div>;
}

function extractBookmarkUrls(value: string) {
  const candidates = [...new DOMParser().parseFromString(value, "text/html").querySelectorAll<HTMLAnchorElement>("a[href]")].map((anchor) => anchor.href);
  const unique = new Set<string>();
  for (const candidate of candidates) {
    try {
      const parsed = new URL(candidate.trim());
      if (/^https?:$/.test(parsed.protocol)) unique.add(parsed.href);
    } catch {
      // Ignore invalid bookmark fragments and report when no usable URL remains.
    }
  }
  return [...unique];
}

async function importBookmarkUrls(urls: string[], enrichMetadata: boolean) {
  const origins = [...new Set(urls.map((url) => {
    const target = new URL(url);
    return `${target.protocol}//${target.hostname}/*`;
  }))];
  const permissionRequest = enrichMetadata ? browser.permissions.request({ origins }).catch(() => false) : Promise.resolve(false);
  const [permissionGranted, result] = await Promise.all([
    permissionRequest,
    inspirationRepository.importUrls("website", urls),
  ]);
  if (permissionGranted && result.addedItems.length > 0) {
    const items = result.addedItems.map(({ id, url }) => {
      const target = new URL(url);
      return { itemId: id, url, permissionPattern: `${target.protocol}//${target.hostname}/*` };
    });
    try {
      await sendExtensionMessage({ type: "capture:remote-batch", items } satisfies ExtensionRequest);
    } finally {
      await browser.permissions.remove({ origins }).catch(() => false);
    }
  } else if (permissionGranted) {
    await browser.permissions.remove({ origins }).catch(() => false);
  }
  void sendExtensionMessage({ type: "ai:process" } satisfies ExtensionRequest).catch(() => undefined);
  return result;
}

function BookmarkSettings({ onImported }: { onImported?: () => void }) {
  const { showToast, showUndoToast } = useToast();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [enrichMetadata, setEnrichMetadata] = useState(false);
  const [result, setResult] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submit = async () => {
    const urls = extractBookmarkUrls(value);
    if (urls.length === 0) {
      setError("书签 HTML 中没有找到可导入的链接");
      return;
    }
    setIsSubmitting(true);
    setError(""); setResult("");
    try {
      const result = await importBookmarkUrls(urls, enrichMetadata);
      if (result.added === 0) {
        setError(`没有新增内容，${result.skipped} 个链接已存在。`);
        return;
      }
      setValue("");
      setResult(`导入完成：新增 ${result.added} 个收藏项，跳过 ${result.skipped} 个已有项。`);
      showUndoToast(`已添加 ${result.added} 个收藏项`, {
        onUndo: async () => {
          try {
            await inspirationRepository.deleteSavedItems(result.addedItems.map((item) => item.id));
            setResult(`已撤回本次导入的 ${result.added} 个收藏项。`);
            showToast("已撤回批量添加", { tone: "success" });
          } catch {
            showToast("撤回添加失败，请稍后重试", { tone: "danger" });
          }
        },
      });
      onImported?.();
    } catch {
      setError("导入未能写入本地收藏库，请重试。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return <form className="settings-form" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
    <SettingsHeader title="导入书签" description="导入浏览器保存的书签，描述与标签可在后台逐步补全。" action={<Button type="submit" variant="primary" size="sm" isDisabled={isSubmitting}>{isSubmitting ? "正在导入…" : "开始导入"}</Button>} />
    <section className="settings-form-section">
      <SettingsSectionHeading title="书签内容" description="书签会作为“网站”类型保存，已存在的规范化链接会自动跳过。" />
      <label className="settings-textarea-label"><span className="sr-only">书签 HTML 内容</span><textarea value={value} onChange={(event) => setValue(event.target.value)} placeholder="粘贴浏览器导出的书签 HTML 内容" autoFocus /></label>
    </section>
    <section className="settings-form-section">
      <SettingsSectionHeading title="补全收藏项信息" description="浏览器将一次确认本批次涉及的网站。" />
      <SettingsCard className="settings-option-card">
        <Switch className="settings-option-switch" label="信息与封面" description="只读取标题、描述、favicon和公开 OG 封面，完成后立即撤销全部访问权限。" isSelected={enrichMetadata} onChange={setEnrichMetadata} />
      </SettingsCard>
      {error ? <p className="form-error" role="alert">{error}</p> : null}{result ? <p className="form-success" role="status">{result}</p> : null}
    </section>
  </form>;
}

function TagsSettings() {
  const { showToast } = useToast();
  const tags = useLiveQuery(() => inspirationRepository.listTags(), []) ?? [];
  const [editingId, setEditingId] = useState<string>();
  const [name, setName] = useState("");
  const [deleteId, setDeleteId] = useState<string>();
  const deleteTag = tags.find((tag) => tag.id === deleteId);
  const save = async (id: string) => { await inspirationRepository.renameTag(id, name); setEditingId(undefined); showToast("标签已保存", { tone: "success" }); };
  const deleteTagItem = async (id: string) => { await inspirationRepository.deleteTag(id); showToast("标签已删除", { tone: "success" }); };
  return <><div className="settings-form">
    <SettingsHeader title="标签" description="统一管理收藏库中的标签，重命名为已有标签会自动合并。" />
    <section className="settings-form-section">
      <SettingsSectionHeading title="已保存标签" description="保留原名称作为别名，已有收藏项会同步更新。" />
      <SettingsCard className="tag-settings-list">
        {tags.length ? tags.map((tag) => <div className="settings-list-row" key={tag.id}>
          {editingId === tag.id ? <Input autoFocus value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void save(tag.id); if (event.key === "Escape") setEditingId(undefined); }} aria-label={`重命名 ${tag.name}`} /> : <div><strong>{tag.name}</strong><span>{tag.usageCount} 个收藏项{tag.aliases.length ? ` · 别名 ${tag.aliases.join("、")}` : ""}</span></div>}
          <div className="settings-list-actions">{editingId === tag.id ? <Button size="sm" variant="primary" onPress={() => void save(tag.id)}>保存</Button> : <Button size="sm" variant="secondary" onPress={() => { setEditingId(tag.id); setName(tag.name); setDeleteId(undefined); }}>重命名</Button>}<Button size="sm" variant="dangerGhost" onPress={() => setDeleteId(tag.id)}>删除</Button></div>
        </div>) : <div className="settings-empty-row">还没有标签。可在收藏项详情中添加。</div>}
      </SettingsCard>
    </section>
  </div><ConfirmDialog isOpen={Boolean(deleteTag)} title="删除标签？" description={deleteTag ? `这将从收藏项中移除“${deleteTag.name}”，此操作无法撤销。` : ""} onClose={() => setDeleteId(undefined)} onConfirm={() => deleteTag ? deleteTagItem(deleteTag.id) : undefined} /></>;
}

function AiSettings() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<AiSettings>(defaultAiSettings);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [summary, setSummary] = useState(emptySummary);
  const [state, setState] = useState<"ready" | "saving" | "saved">("ready");
  const [connectionState, setConnectionState] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [connectionMessage, setConnectionMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void Promise.all([
      sendExtensionMessage<AiSettingsView>({ type: "ai:config:get" } satisfies ExtensionRequest),
      sendExtensionMessage<AiTaskSummary>({ type: "ai:tasks:summary" } satisfies ExtensionRequest),
    ]).then(([view, taskSummary]) => { setSettings(view); setHasApiKey(view.hasApiKey); setSummary(taskSummary); }).catch((reason) => setError(reason instanceof Error ? reason.message : "无法读取 AI 设置"));
  }, []);

  const save = async () => {
    setState("saving");
    setError("");
    try {
      if (settings.enabled) {
        const granted = await browser.permissions.request({ origins: [endpointPermissionPattern(settings.endpoint)] });
        if (!granted) throw new Error("需要允许访问当前 Provider 域名，才能发送 AI 请求。");
        if (!apiKey.trim() && !hasApiKey) throw new Error("请填写 API Key。");
      }
      const view = await sendExtensionMessage<AiSettingsView>({ type: "ai:config:save", settings: { ...settings, apiKey: apiKey.trim() || undefined } } satisfies ExtensionRequest);
      setSettings(view); setHasApiKey(view.hasApiKey); setApiKey(""); setState("saved");
      showToast("AI 设置已保存", { tone: "success" });
      setSummary(await sendExtensionMessage<AiTaskSummary>({ type: "ai:tasks:summary" } satisfies ExtensionRequest));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "保存 AI 设置失败");
      setState("ready");
    }
  };
  const retryFailed = async () => {
    setError("");
    try { setSummary(await sendExtensionMessage<AiTaskSummary>({ type: "ai:retry-failed" } satisfies ExtensionRequest)); } catch (reason) { setError(reason instanceof Error ? reason.message : "重试 AI 任务失败"); }
  };
  const testConnection = async () => {
    setConnectionState("testing"); setConnectionMessage("");
    try {
      const granted = await browser.permissions.request({ origins: [endpointPermissionPattern(settings.endpoint)] });
      if (!granted) throw new Error("需要允许访问当前 Provider 域名，才能测试连接。");
      await sendExtensionMessage({ type: "ai:config:test", settings: { ...settings, apiKey: apiKey.trim() || undefined } } satisfies ExtensionRequest);
      setConnectionState("success"); setConnectionMessage("连接成功，API Key、Endpoint 和 Model 可用。");
    } catch (reason) { setConnectionState("error"); setConnectionMessage(reason instanceof Error ? reason.message : "连接测试失败"); }
  };
  const setProvider = (provider: AiSettings["provider"]) => {
    if (provider !== settings.provider) { setHasApiKey(false); setApiKey(""); }
    if (provider === "custom") { setSettings((current) => ({ ...current, provider })); return; }
    const preset = aiProviderPresets[provider];
    setSettings((current) => ({ ...current, provider, endpoint: preset.endpoint, model: preset.model }));
  };
  const selectedStorageDescription = apiKeyStorageOptions.find((option) => option.value === settings.apiKeyStorage)?.description ?? "退出浏览器后需重新填写。";

  return <div className="settings-form">
    <SettingsHeader title="AI 助手" description="可选的 OpenAI-compatible Provider，不会影响本地添加、编辑与搜索。" action={<Button variant="primary" size="sm" isDisabled={state === "saving"} onPress={() => void save()}>{state === "saving" ? "保存中…" : "保存设置"}</Button>} />
    <section className="settings-form-section">
      <SettingsSectionHeading title="自动整理" description="AI 只负责补全信息，关闭后不影响本地功能。" />
      <SettingsCard><Switch className="settings-option-switch" label="启用 AI 自动整理" description="关闭后已保存的收藏项和本地功能保持不变。" isSelected={settings.enabled} onChange={(enabled) => setSettings((current) => ({ ...current, enabled }))} /></SettingsCard>
    </section>
    <section className="settings-form-section">
      <SettingsSectionHeading title="模型与连接" description="选择服务并配置请求地址、模型和 API Key。" />
      <SettingsCard>
        <SettingsRow title="Provider" description={settings.provider === "deepseek" ? "DeepSeek 官方 API，默认模型。" : "预设会同步填入 Endpoint 和默认模型。"} control={<SelectMenu<AiSettings["provider"]> label="Provider" value={settings.provider} options={aiProviderOptions} onChange={setProvider} className="ai-provider-select" />} />
        <SettingsRow title="Endpoint" control={<Field label="Endpoint" value={settings.endpoint} onChange={(endpoint) => setSettings((current) => ({ ...current, endpoint }))} placeholder="https://api.openai.com/v1" />} />
        <SettingsRow title="Model" control={<Field label="Model" value={settings.model} onChange={(model) => setSettings((current) => ({ ...current, model }))} placeholder="gpt-4.1-mini" />} />
        <SettingsRow title="API Key" description={hasApiKey ? "已保存；留空保持不变。" : "填写你自己的 API Key。"} control={<Field label="API Key" type="password" value={apiKey} onChange={setApiKey} placeholder={hasApiKey ? "已保存；留空保持不变" : "填写你自己的 API Key"} />} />
        <SettingsRow title="测试连接" description="发送最小请求，不保存当前表单或 API Key。" control={<Button variant="secondary" size="sm" isDisabled={connectionState === "testing"} onPress={() => void testConnection()}><RiRefreshLine size={15} />{connectionState === "testing" ? "正在测试…" : "测试连接"}</Button>} >{connectionMessage ? <span className={connectionState === "success" ? "is-success" : "is-error"} role="status">{connectionMessage}</span> : null}</SettingsRow>
      </SettingsCard>
    </section>
    <section className="settings-form-section">
      <SettingsSectionHeading title="数据与任务" description="控制 Key 的保存位置，并查看自动整理进度。" />
      <SettingsCard>
        <SettingsRow title="Key 保存方式" description={selectedStorageDescription} control={<SelectMenu<ApiKeyStorage> label="Key 保存方式" value={settings.apiKeyStorage} options={apiKeyStorageOptions} onChange={(apiKeyStorage) => setSettings((current) => ({ ...current, apiKeyStorage }))} className="settings-select-menu" />} />
        <SettingsRow title="发送范围" description="只发送链接、标题、描述、正文与标签；Key 不会进入本地数据库或备份。" />
        <SettingsRow title="处理任务" description={`等待 ${summary.pending} · 失败 ${summary.failed} · 完成 ${summary.complete}`} control={<Button variant="secondary" size="sm" isDisabled={!summary.failed} onPress={() => void retryFailed()}><RiRefreshLine size={15} />重试失败任务</Button>} />
      </SettingsCard>
    </section>
    {error ? <p className="form-error" role="alert">{error}</p> : null}
    {state === "saved" ? <p className="form-success" role="status">设置已保存，可处理的任务已开始运行。</p> : null}
  </div>;
}

function BackupSettings() {
  const { showToast } = useToast();
  const [selected, setSelected] = useState<{ name: string; backup: Backup }>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const exportFile = async () => {
    setBusy(true); setError(""); setResult("");
    try {
      const backup = await createBackup();
      const file = new Blob([JSON.stringify(backup)], { type: "application/json" });
      if (file.size > MAX_BACKUP_BYTES) throw new Error("备份超过 100 MB，当前版本无法安全处理；未下载不可恢复的文件。");
      const url = URL.createObjectURL(file); const link = document.createElement("a"); link.href = url; link.download = `wanderland-backup-${new Date().toISOString().slice(0, 10)}.json`; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setResult(`已准备下载：${backup.savedItems.length} 个收藏项，含标签、快照、封面和快捷视图。`);
      showToast("备份文件已准备下载", { tone: "success" });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "导出失败，未生成备份文件。请检查浏览器存储空间后重试。"); } finally { setBusy(false); }
  };
  const chooseFile = async (file?: File) => {
    setSelected(undefined); setError(""); setResult(""); if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) { setError("备份文件超过 100 MB，未读取。请先检查文件来源。"); return; }
    setBusy(true);
    try { setSelected({ name: file.name, backup: parseBackup(JSON.parse(await file.text()) as unknown) }); } catch (cause) { setError(cause instanceof Error ? cause.message : "无法读取备份文件。"); } finally { setBusy(false); }
  };
  const restore = async () => {
    if (!selected) return;
    setBusy(true); setError(""); setResult("");
    try { const outcome = await restoreBackup(selected.backup); setResult(`恢复完成：新增 ${outcome.added} 个收藏项，跳过 ${outcome.skipped} 个已有项，新增 ${outcome.views} 个快捷视图。`); setSelected(undefined); showToast(`恢复完成：新增 ${outcome.added} 个收藏项`, { tone: "success" }); } catch (cause) { setError(cause instanceof Error ? cause.message : "恢复失败；数据库事务已回滚，原有数据未删除。"); } finally { setBusy(false); }
  };
  return <div className="settings-form">
    <SettingsHeader title="备份与恢复" description="将本地收藏库保存为文件，或从先前的备份补回内容。" />
    <section className="settings-form-section">
      <SettingsSectionHeading title="本地收藏库" description="导出完整备份，或从已有文件合并恢复。" />
      <SettingsCard>
        <SettingsRow title="导出完整收藏库" description="包含收藏项、归档项、标签、正文快照、封面图片、快捷视图和待处理任务。" control={<Button variant="secondary" isDisabled={busy} onPress={() => void exportFile()}>下载备份文件</Button>} />
        <SettingsRow title="从备份恢复" description="只补入缺少的收藏项，不覆盖或删除当前内容；相同类型和网址的项目会跳过。" control={<label className="button button-secondary button-md backup-file-label">选择 JSON 备份<input type="file" accept=".json,application/json" disabled={busy} onChange={(event) => { void chooseFile(event.target.files?.[0]); event.target.value = ""; }} /></label>}>
          {selected ? <div className="settings-backup-preview"><strong>{selected.name}</strong><span>{selected.backup.savedItems.length} 个收藏项 · {selected.backup.snapshots.length} 份快照 · {selected.backup.tags.length} 个标签</span><Button variant="primary" isDisabled={busy} onPress={() => void restore()}>确认合并恢复</Button></div> : null}
        </SettingsRow>
      </SettingsCard>
      {error ? <p className="form-error" role="alert">{error}</p> : null}{result ? <p className="form-success" role="status">{result}</p> : null}
    </section>
    <section className="settings-form-section">
      <SettingsSectionHeading title="隐私与迁移" description="备份文件由你自行保管。" />
      <SettingsCard><SettingsRow title="备份内容" description="备份文件保存在你选择的位置，包含私人收藏与网页正文；不包含 AI API Key。AI Provider 设置保持当前浏览器原样，迁移到新浏览器时需重新配置。" control={<RiShieldCheckLine size={20} aria-hidden="true" />} /></SettingsCard>
    </section>
  </div>;
}

function formatArchivedAt(timestamp: number) { return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(timestamp); }

function ArchiveSettings() {
  const { showToast, showUndoToast } = useToast();
  const items = useLiveQuery(async () => (await inspirationRepository.listLibraryItems()).filter((item) => item.archivedAt).sort((a, b) => (b.archivedAt ?? 0) - (a.archivedAt ?? 0)), []) ?? [];
  const restoreItem = async (id: string) => {
    const item = items.find((candidate) => candidate.id === id);
    await inspirationRepository.setArchived(id, false);
    showUndoToast("已取消归档", {
      subject: item?.title,
      onUndo: async () => {
        try {
          await inspirationRepository.setArchived(id, true);
          showToast("已恢复归档", { tone: "success" });
        } catch {
          showToast("撤回取消归档失败，请稍后重试", { tone: "danger" });
        }
      },
    });
  };
  const restoreDeletedItem = async (deleted: DeletedSavedItem) => {
    try {
      const restored = await inspirationRepository.restoreSavedItem(deleted);
      showToast(restored ? "已撤回删除" : "撤回失败：收藏项已存在", { tone: restored ? "success" : "danger" });
    } catch {
      showToast("撤回失败，请稍后重试", { tone: "danger" });
    }
  };
  const deleteArchivedItem = async (id: string) => {
    const deleted = await inspirationRepository.deleteSavedItem(id);
    if (!deleted) return;
    showUndoToast("已删除收藏项", { subject: deleted.item.title, onUndo: () => restoreDeletedItem(deleted) });
  };
  return <div className="settings-form"><SettingsHeader title="归档" description="归档项不会出现在收藏库中，可随时恢复或永久删除。" /><section className="settings-form-section"><SettingsSectionHeading title="已归档内容" description="恢复后会回到原来的收藏库范围。" /><SettingsCard className="archive-settings-list">{items.length ? items.map((item) => <article className="settings-list-row" key={item.id}><div><strong>{item.title}</strong><span>{formatArchivedAt(item.archivedAt!)}</span></div><div className="settings-list-actions"><Button size="sm" variant="dangerGhost" onPress={() => void deleteArchivedItem(item.id)}>删除</Button><Button size="sm" variant="secondary" onPress={() => void restoreItem(item.id)}>取消归档</Button></div></article>) : <div className="settings-empty-row">还没有归档内容。</div>}</SettingsCard></section></div>;
}

function PlaceholderSettings({ section }: { section: "appearance" | "digest" | "about" }) {
  const data = {
    appearance: { title: "外观", description: "调整工作台的显示方式。", body: "外观设置将在后续版本开放。" },
    digest: { title: "内容简报", description: "把收藏库整理成可回顾的内容简报。", body: "内容简报将在后续版本开放。" },
    about: { title: "关于Webloom", description: "了解当前版本与本地优先的数据边界。", body: "Wanderland v0.6.8 · 数据只保存在当前浏览器。" },
  }[section];
  return <div className="settings-form"><SettingsHeader title={data.title} description={data.description} /><section className="settings-form-section"><SettingsSectionHeading title={data.title} description={data.description} /><SettingsCard><SettingsRow title={data.title} description={data.body} control={<RiInformationLine size={20} aria-hidden="true" />} /></SettingsCard></section></div>;
}

export function SettingsPage({ onBackToLibrary }: { onBackToLibrary: () => void }) {
  const [section, setSection] = useState<SettingsSection>("bookmarks");
  const contentRef = useRef<HTMLDivElement>(null);
  const riseAnimations = useRef<Animation[]>([]);
  const items = useLiveQuery(() => inspirationRepository.listLibraryItems(), []) ?? [];
  const views = useLiveQuery(() => inspirationRepository.listLibrarySavedViews(), []) ?? [];
  const sectionContent = section === "bookmarks" ? <BookmarkSettings /> : section === "tags" ? <TagsSettings /> : section === "ai" ? <AiSettings /> : section === "backup" ? <BackupSettings /> : section === "archive" ? <ArchiveSettings /> : <PlaceholderSettings section={section} />;

  useLayoutEffect(() => {
    riseAnimations.current.forEach((animation) => animation.cancel());
    if (contentRef.current) riseAnimations.current = rise(contentRef.current);
  }, [section]);

  useEffect(() => () => riseAnimations.current.forEach((animation) => animation.cancel()), []);

  return <AppShell items={items} activeScope="all" activeSavedView={null} savedViews={views} onScopeChange={() => undefined} onSavedViewChange={() => undefined} onSavedViewRename={() => undefined} onSavedViewDelete={() => undefined} onSavedViewMove={() => undefined} mode="settings" activeSettingsSection={section} onSettingsSectionChange={setSection} onBackToLibrary={onBackToLibrary}>
    <div className="settings-page"><div ref={contentRef} className="settings-page-content">{sectionContent}</div></div>
  </AppShell>;
}
