import { RiAddLine, RiArrowLeftLine, RiArrowUpDownLine, RiCheckLine, RiErrorWarningLine, RiLayoutGridLine, RiListCheck3, RiPriceTag3Line, RiSearchLine, RiSettings3Line } from "@remixicon/react";
import { useState, type ReactNode } from "react";
import { FloatingAddMenu } from "@/src/components/inspiration/FloatingAddMenu";
import { InspirationCard } from "@/src/components/inspiration/InspirationCard";
import { SavedViewNavItem } from "@/src/components/layout/SavedViewNavItem";
import { SidebarIcon } from "@/src/components/layout/SidebarIcon";
import { SidebarNavItem } from "@/src/components/layout/SidebarNavItem";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Field } from "@/src/components/ui/Field";
import { FacetFilter } from "@/src/components/ui/FacetFilter";
import { RadioGroup } from "@/src/components/ui/RadioGroup";
import { SegmentedControl } from "@/src/components/ui/SegmentedControl";
import { SelectMenu } from "@/src/components/ui/SelectMenu";
import { SelectedTagBar } from "@/src/components/ui/SelectedTagBar";
import { Switch } from "@/src/components/ui/Switch";
import { inspirationItems } from "@/src/data/demo";
import type { LibrarySavedView } from "@/src/domain/inspiration";

const colors = [
  { name: "页面背景", token: "--color-canvas", value: "#F4F1ED" },
  { name: "内容表面", token: "--color-surface", value: "#FFFFFF" },
  { name: "次级表面", token: "--color-surface-secondary", value: "#F6F5F4" },
  { name: "默认描边", token: "--color-border-default", value: "#F2F0ED" },
  { name: "主文字", token: "--color-ink", value: "#2E2E2E" },
  { name: "次级文字", token: "--color-text", value: "#525252" },
  { name: "三级文字", token: "--color-muted", value: "#707070" },
  { name: "品牌主色", token: "--color-brand", value: "#FF760E" },
  { name: "悬停主色", token: "--color-brand-hover", value: "#E96A08" },
  { name: "主色背景 10%", token: "--color-accent-primary-bg", value: "#FF760E · 10%" },
  { name: "主色描边 20%", token: "--color-accent-primary-border", value: "#FF760E · 20%" },
  { name: "滚动条", token: "--color-scrollbar-thumb", value: "#B7B0A8" },
  { name: "成功", token: "--color-success", value: "#3B6D53" },
  { name: "提示", token: "--color-info", value: "#356A96" },
  { name: "危险", token: "--color-danger", value: "#FF5252" },
];

const layoutOptions = [
  { value: "grid", label: "网格布局", icon: <RiLayoutGridLine size={15} aria-hidden="true" /> },
  { value: "compact", label: "紧凑布局", icon: <RiListCheck3 size={15} aria-hidden="true" /> },
] as const;

function PreviewSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="preview-section">
      <div className="preview-section-title"><h2>{title}</h2><p>{description}</p></div>
      <div className="preview-canvas">{children}</div>
    </section>
  );
}

export function DesignSystemPage({ onBack }: { onBack: () => void }) {
  const [previewViews, setPreviewViews] = useState<LibrarySavedView[]>([
    { id: "preview-read-later", name: "稍后阅读", isSystem: true, scope: "article", tagIds: [], tags: [], sortOrder: 0, createdAt: 0, updatedAt: 0 },
    { id: "preview-design", name: "设计灵感", isSystem: false, scope: "website", tagIds: ["design"], tags: ["设计灵感"], sortOrder: 1, createdAt: 0, updatedAt: 0 },
    { id: "preview-dev", name: "开发资源", isSystem: false, scope: "all", tagIds: ["components"], tags: ["组件库"], sortOrder: 2, createdAt: 0, updatedAt: 0 },
  ]);
  const [activePreviewView, setActivePreviewView] = useState("preview-design");
  const [previewTags, setPreviewTags] = useState<string[]>(["design"]);
  const [previewSort, setPreviewSort] = useState<"newest" | "oldest">("newest");
  const [previewSwitch, setPreviewSwitch] = useState(true);
  const [previewStorage, setPreviewStorage] = useState<"session" | "local">("session");
  const movePreviewView = (sourceId: string, targetId: string) => {
    setPreviewViews((current) => {
      const system = current.filter((view) => view.isSystem);
      const custom = current.filter((view) => !view.isSystem);
      const sourceIndex = custom.findIndex((view) => view.id === sourceId);
      if (sourceIndex < 0) return current;
      const [moved] = custom.splice(sourceIndex, 1);
      if (!moved) return current;
      const targetIndex = targetId === system[0]?.id ? 0 : custom.findIndex((view) => view.id === targetId);
      custom.splice(targetIndex < 0 ? custom.length : targetIndex, 0, moved);
      return [...system, ...custom];
    });
  };

  return (
    <div className="design-system-page">
      <header className="design-system-header">
        <Button variant="ghost" onPress={onBack}><RiArrowLeftLine size={17} />返回 Wanderland</Button>
        <div><span>DEV ONLY</span><h1>Wanderland · 设计系统</h1><p>用于验证 token、组件变体与页面组合的一致性。</p></div>
      </header>

      <div className="design-system-content">
        <PreviewSection title="颜色" description="色块使用 Display-P3 渲染；数值以便于设计核对的大写十六进制参考值展示。">
          <div className="color-grid">{colors.map(({ name, token, value }) => <div className="color-swatch" key={name}><i style={{ background: `var(${token})` }} /><span>{name}</span><code>{value}</code></div>)}</div>
        </PreviewSection>

        <PreviewSection title="字体" description="界面、标题与标签按字符混排 Geist Mono 和系统中文字体；描述使用系统字体，特殊标题保持宋体角色。">
          <div className="type-specimens">
            <div><span>Brand / Condensed Bold</span><p className="display-type">Wanderland</p></div>
            <div><span>Headline / PingFang SC</span><p className="headline-type">发现看到的美好</p></div>
            <div><span>Interface / Unicode-range CJK + Geist Mono</span><p>搜索设计、创意或关键词……「Wanderland UI」2026，快速找回真正有用的内容。</p></div>
            <div><span>Content title &amp; tag / Unicode-range CJK + Geist Mono</span><p className="content-title-type">Design Systems 设计系统 · #React组件库</p></div>
            <div><span>Description / System Sans</span><p className="description-type">A readable description 使用系统字体呈现，适合连续阅读。</p></div>
            <div><span>Metadata / Geist Mono</span><code>collectui.com · Last updated: 3 hours ago</code></div>
          </div>
        </PreviewSection>

        <PreviewSection title="按钮与控件" description="通过既有 variant 扩展语义，而不是创建相似按钮。">
          <div className="component-stack">
            <div className="component-row">
              <Button variant="primary"><RiAddLine size={16} />添加链接</Button>
              <Button variant="secondary"><RiSettings3Line size={16} />管理标签</Button>
              <Button variant="ghost">取消</Button>
              <Button variant="danger"><RiErrorWarningLine size={16} />删除</Button>
              <Button variant="primary" isDisabled>正在保存</Button>
            </div>
            <div className="component-row">
              <Switch label="自动整理" description="保存后生成描述与标签" isSelected={previewSwitch} onChange={setPreviewSwitch} />
              <Switch label="停用状态" isDisabled />
              <RadioGroup className="ai-key-storage" label="保存方式" value={previewStorage} onChange={setPreviewStorage} options={[{ value: "session", label: "仅当前会话" }, { value: "local", label: "本地浏览器" }]} />
              <Badge>产品设计</Badge><Badge variant="neutral">React Aria</Badge>
              <FacetFilter label="标签" icon={<RiPriceTag3Line size={15} aria-hidden="true" />} options={[{ id: "design", label: "#设计", count: 15 }, { id: "react", label: "#React", count: 8 }, { id: "motion", label: "#动效", count: 6 }]} selectedValues={previewTags} onChange={setPreviewTags} searchable searchPlaceholder="搜索标签" />
              <SelectMenu label="排序方式" value={previewSort} options={[{ value: "newest", label: "最新" }, { value: "oldest", label: "最旧" }]} onChange={setPreviewSort} icon={<RiArrowUpDownLine size={15} aria-hidden="true" />} />
              <SegmentedControl label="布局示例" value="grid" options={layoutOptions} onChange={() => undefined} />
            </div>
            <SelectedTagBar tags={["设计", "React", "动效", "组件库", "可访问性"]} onRemove={() => undefined} actions={<div className="filter-result-actions"><Button variant="secondary" size="sm">保存为快捷视图</Button><Button variant="ghost" size="sm">清除全部</Button></div>} />
          </div>
        </PreviewSection>

        <PreviewSection title="侧栏导航" description="使用设计稿原始图标；系统视图固定，用户视图支持改名、删除和拖动排序。">
          <div className="sidebar-component-preview">
            <div className="nav-list">
              <SidebarNavItem icon={<SidebarIcon src="/assets/sidebar/inbox.svg" />} label="全部" count={22} isActive={!activePreviewView} onPress={() => setActivePreviewView("")} />
              <SidebarNavItem icon={<SidebarIcon src="/assets/sidebar/article.svg" />} label="文章" count={1} onPress={() => setActivePreviewView("")} />
            </div>
            <p className="nav-label">快捷视图</p>
            <div className="nav-list">
              {previewViews.map((view) => <SavedViewNavItem key={view.id} view={view} iconSrc={`/assets/sidebar/${view.isSystem ? "timer" : "lightbulb"}.svg`} isActive={activePreviewView === view.id} onPress={() => setActivePreviewView(view.id)} onRename={(name) => setPreviewViews((current) => current.map((item) => item.id === view.id ? { ...item, name } : item))} onDelete={() => setPreviewViews((current) => current.filter((item) => item.id !== view.id || item.isSystem))} onMove={(sourceId) => movePreviewView(sourceId, view.id)} />)}
            </div>
          </div>
        </PreviewSection>

        <PreviewSection title="表单" description="输入、搜索与描述共享焦点、圆角和表面规范。">
          <div className="form-preview">
            <Field label="名称" defaultValue="Intent UI" />
            <Field label="来源链接" defaultValue="https://intentui.com" />
            <Field label="描述（可选）" placeholder="写下一段便于以后识别的描述" multiline />
            <div className="inline-search"><RiSearchLine size={18} /><input aria-label="搜索示例" placeholder="Search designs, creatives, or keywords..." /><kbd>⌘ K</kbd></div>
          </div>
        </PreviewSection>

        <PreviewSection title="内容卡片" description="同一领域组件覆盖卡片与列表两种排列，并根据网站、文章和关注源调整内容结构。">
          <div className="card-layout-specimens">
            <div><span>卡片排列</span><div className="card-preview-grid">{inspirationItems.slice(0, 3).map((item) => <InspirationCard key={item.id} item={item} layout="cards" onOpen={() => undefined} onTagClick={() => undefined} onToggleFavorite={() => undefined} />)}</div></div>
            <div><span>列表排列</span><div className="list-preview-stack">{inspirationItems.slice(0, 3).map((item) => <InspirationCard key={item.id} item={item} layout="list" onOpen={() => undefined} onTagClick={() => undefined} onToggleFavorite={() => undefined} />)}</div></div>
          </div>
        </PreviewSection>

        <PreviewSection title="添加入口" description="悬停、聚焦或点击主按钮后，展开带背景模糊的内容类型菜单，文字保持在按钮点击区域内。">
          <FloatingAddMenu placement="preview" onSelect={() => undefined} />
        </PreviewSection>

        <PreviewSection title="布局与反馈" description="面板靠色调和间距分层；关键反馈同时使用图标与文字。">
          <div className="layout-preview">
            <Card className="layout-nav"><strong>内容类型</strong><span className="is-selected">网站</span><span>文章</span><span>关注源</span></Card>
            <Card className="layout-main"><div className="feedback success"><RiCheckLine size={16} /><span><strong>添加成功</strong>链接已保存，正在后台整理。</span></div><div className="skeleton-lines"><i /><i /><i /></div></Card>
          </div>
        </PreviewSection>
      </div>
    </div>
  );
}
