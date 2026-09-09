import { RiCloseLine, RiRefreshLine } from "@remixicon/react";
import { useEffect, useState } from "react";
import { Dialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { endpointPermissionPattern } from "@/src/ai/config";
import { defaultAiSettings } from "@/src/ai/config";
import type { AiSettings, AiSettingsView, AiTaskSummary, ApiKeyStorage } from "@/src/ai/types";
import { aiProviderPresets } from "@/src/ai/presets";
import type { ExtensionRequest } from "@/src/capture/types";
import { Button } from "@/src/components/ui/Button";
import { Field } from "@/src/components/ui/Field";

const emptySummary: AiTaskSummary = { pending: 0, running: 0, failed: 0, complete: 0 };

export function AiSettingsDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [settings, setSettings] = useState<AiSettings>(defaultAiSettings);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [summary, setSummary] = useState(emptySummary);
  const [state, setState] = useState<"ready" | "saving" | "saved">("ready");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    void Promise.all([
      browser.runtime.sendMessage({ type: "ai:config:get" } satisfies ExtensionRequest) as Promise<AiSettingsView>,
      browser.runtime.sendMessage({ type: "ai:tasks:summary" } satisfies ExtensionRequest) as Promise<AiTaskSummary>,
    ]).then(([view, taskSummary]) => {
      setSettings(view);
      setHasApiKey(view.hasApiKey);
      setSummary(taskSummary);
    }).catch((reason) => setError(reason instanceof Error ? reason.message : "无法读取 AI 设置"));
  }, [isOpen]);

  const save = async () => {
    setState("saving");
    setError("");
    try {
      if (settings.enabled) {
        const granted = await browser.permissions.request({ origins: [endpointPermissionPattern(settings.endpoint)] });
        if (!granted) throw new Error("需要允许访问当前 Provider 域名，才能发送 AI 请求。");
        if (!apiKey.trim() && !hasApiKey) throw new Error("请填写 API Key。");
      }
      const view = await browser.runtime.sendMessage({
        type: "ai:config:save",
        settings: { ...settings, apiKey: apiKey.trim() || undefined },
      } satisfies ExtensionRequest) as AiSettingsView;
      setSettings(view);
      setHasApiKey(view.hasApiKey);
      setApiKey("");
      setState("saved");
      const taskSummary = await browser.runtime.sendMessage({ type: "ai:tasks:summary" } satisfies ExtensionRequest) as AiTaskSummary;
      setSummary(taskSummary);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "保存 AI 设置失败");
      setState("ready");
    }
  };

  const retryFailed = async () => {
    setError("");
    try {
      const next = await browser.runtime.sendMessage({ type: "ai:retry-failed" } satisfies ExtensionRequest) as AiTaskSummary;
      setSummary(next);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "重试 AI 任务失败");
    }
  };

  const setStorage = (apiKeyStorage: ApiKeyStorage) => setSettings((current) => ({ ...current, apiKeyStorage }));
  const setProvider = (provider: AiSettings["provider"]) => {
    if (provider !== settings.provider) {
      setHasApiKey(false);
      setApiKey("");
    }
    if (provider === "custom") {
      setSettings((current) => ({ ...current, provider }));
      return;
    }
    const preset = aiProviderPresets[provider];
    setSettings((current) => ({ ...current, provider, endpoint: preset.endpoint, model: preset.model }));
  };

  return (
    <ModalOverlay className="detail-overlay" isOpen={isOpen} isDismissable onOpenChange={(open) => !open && onClose()}>
      <Modal className="form-modal settings-modal ai-settings-modal">
        <Dialog className="form-dialog">
          {({ close }) => <>
            <header className="form-dialog-header settings-header"><div><Heading slot="title">AI 助手</Heading><p>可选的 OpenAI-compatible Provider，不会影响本地添加、编辑与搜索。</p></div><Button size="icon" variant="ghost" aria-label="关闭 AI 设置" onPress={close}><RiCloseLine size={19} /></Button></header>
            <div className="form-dialog-body ai-settings-body">
              <label className="ai-toggle"><input type="checkbox" checked={settings.enabled} onChange={(event) => setSettings((current) => ({ ...current, enabled: event.target.checked }))} /><span><strong>启用 AI 自动整理</strong><small>关闭后已保存的收藏项和本地功能保持不变。</small></span></label>
              <label className="ai-provider-field"><span>Provider</span><select value={settings.provider} onChange={(event) => setProvider(event.target.value as AiSettings["provider"])}><option value="openai">OpenAI</option><option value="deepseek">DeepSeek</option><option value="custom">自定义 OpenAI-compatible</option></select><small>{settings.provider === "deepseek" ? "使用 DeepSeek 官方 API，默认 deepseek-v4-flash。" : "选择预设会同步填入官方 Endpoint 和默认模型。"}</small></label>
              <Field label="Endpoint" value={settings.endpoint} onChange={(endpoint) => setSettings((current) => ({ ...current, endpoint }))} placeholder="https://api.openai.com/v1" />
              <Field label="Model" value={settings.model} onChange={(model) => setSettings((current) => ({ ...current, model }))} placeholder="gpt-4.1-mini" />
              <Field label="API Key" type="password" value={apiKey} onChange={setApiKey} placeholder={hasApiKey ? "已保存；留空保持不变" : "填写你自己的 API Key"} />
              <fieldset className="ai-key-storage"><legend>Key 保存方式</legend><label><input type="radio" name="api-key-storage" checked={settings.apiKeyStorage === "session"} onChange={() => setStorage("session")} /><span>仅当前浏览器会话<small>浏览器完全退出后需要重新填写。</small></span></label><label><input type="radio" name="api-key-storage" checked={settings.apiKeyStorage === "local"} onChange={() => setStorage("local")} /><span>保存在本地浏览器<small>不使用同步存储，但扩展无法真正隐藏客户端 Key。</small></span></label></fieldset>
              <div className="ai-privacy-note"><strong>发送范围</strong><p>只会向你配置的 Provider 发送收藏项链接、标题、现有描述、最多 12,000 字的正文与已有标签名。Key 不进入 IndexedDB，也不包含在数据导入中。</p></div>
              <div className="ai-task-status"><div><strong>处理任务</strong><span>等待 {summary.pending} · 失败 {summary.failed} · 完成 {summary.complete}</span></div><Button variant="secondary" size="sm" isDisabled={!summary.failed} onPress={() => void retryFailed()}><RiRefreshLine size={15} />重试失败任务</Button></div>
              {error ? <p className="form-error" role="alert">{error}</p> : null}
              {state === "saved" ? <p className="form-success" role="status">设置已保存，可处理的任务已开始运行。</p> : null}
            </div>
            <footer className="form-dialog-footer"><Button variant="ghost" onPress={close}>取消</Button><Button variant="primary" isDisabled={state === "saving"} onPress={() => void save()}>{state === "saving" ? "保存中…" : "保存 AI 设置"}</Button></footer>
          </>}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
