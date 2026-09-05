import { RiAddLine, RiArrowLeftLine, RiCheckLine, RiErrorWarningLine, RiSearchLine, RiSettings3Line } from "@remixicon/react";
import type { ReactNode } from "react";
import { InspirationCard } from "@/src/components/inspiration/InspirationCard";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Field } from "@/src/components/ui/Field";
import { StatusDot } from "@/src/components/ui/StatusDot";
import { inspirationItems } from "@/src/data/demo";

const colors = [
  ["页面背景", "#f4f1ed"], ["内容表面", "#ffffff"], ["次级表面", "#f8f6f3"],
  ["主文字", "#181512"], ["正文", "#2c2925"], ["次级文字", "#5f5a54"],
  ["品牌主色", "#e97603"], ["悬停主色", "#d96d00"], ["品牌浅色", "#f1ebe5"],
  ["成功", "#3b6d53"], ["提示", "#356a96"], ["危险", "#b6463a"],
];

function PreviewSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="preview-section">
      <div className="preview-section-title"><h2>{title}</h2><p>{description}</p></div>
      <div className="preview-canvas">{children}</div>
    </section>
  );
}

export function DesignSystemPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="design-system-page">
      <header className="design-system-header">
        <Button variant="ghost" onPress={onBack}><RiArrowLeftLine size={17} />返回 Wanderly</Button>
        <div><span>DEV ONLY</span><h1>个人灵感库 · 设计系统</h1><p>用于验证 token、组件变体与页面组合的一致性。</p></div>
      </header>

      <div className="design-system-content">
        <PreviewSection title="颜色" description="以品牌橙和暖灰画布为锚点，深色变体负责可读交互，浅色变体负责选中与提示表面。">
          <div className="color-grid">{colors.map(([name, value]) => <div className="color-swatch" key={name}><i style={{ background: value }} /><span>{name}</span><code>{value}</code></div>)}</div>
        </PreviewSection>

        <PreviewSection title="字体" description="品牌、界面与内容分别使用窄体、系统无衬线与等宽字体，建立清楚的职责层级。">
          <div className="type-specimens">
            <div><span>Brand / Geist Mono</span><p className="display-type">Wanderly</p></div>
            <div><span>Headline / PingFang SC</span><p className="headline-type">发现看到的美好</p></div>
            <div><span>Interface / Geist Mono + PingFang SC</span><p>通过名称、描述、封面、频道与标签建立识别线索，在一分钟内找回真正有用的网站。</p></div>
            <div><span>Metadata / Geist Mono</span><code>collectui.com · Last updated: 3 hours ago</code></div>
          </div>
        </PreviewSection>

        <PreviewSection title="按钮与状态" description="通过既有 variant 扩展语义，而不是创建相似按钮。">
          <div className="component-stack">
            <div className="component-row">
              <Button variant="primary"><RiAddLine size={16} />收藏链接</Button>
              <Button variant="secondary"><RiSettings3Line size={16} />管理频道</Button>
              <Button variant="ghost">取消</Button>
              <Button variant="danger"><RiErrorWarningLine size={16} />删除</Button>
              <Button variant="primary" isDisabled>正在保存</Button>
            </div>
            <div className="component-row">
              <StatusDot status="complete" /><StatusDot status="pending" /><StatusDot status="failed" />
              <Badge>产品设计</Badge><Badge>React Aria</Badge>
            </div>
          </div>
        </PreviewSection>

        <PreviewSection title="表单" description="输入、搜索与备注共享焦点、圆角和表面规范。">
          <div className="form-preview">
            <Field label="灵感名称" defaultValue="Intent UI" />
            <Field label="来源链接" defaultValue="https://intentui.com" />
            <Field label="备注" placeholder="为什么收藏它？以后准备怎么用？" multiline />
            <div className="inline-search"><RiSearchLine size={18} /><input aria-label="搜索示例" placeholder="Search designs, creatives, or keywords..." /><kbd>⌘ K</kbd></div>
          </div>
        </PreviewSection>

        <PreviewSection title="卡片" description="内容卡片组合封面、状态、标签和既有操作组件。">
          <div className="card-preview-grid">
            {inspirationItems.slice(0, 3).map((item) => <InspirationCard key={item.id} item={item} onOpen={() => undefined} onTagClick={() => undefined} />)}
          </div>
        </PreviewSection>

        <PreviewSection title="布局与反馈" description="面板靠色调和间距分层；关键反馈同时使用图标与文字。">
          <div className="layout-preview">
            <Card className="layout-nav"><strong>网页</strong><span className="is-selected">全部</span><span>设计</span><span>工具</span></Card>
            <Card className="layout-main"><div className="feedback success"><RiCheckLine size={16} /><span><strong>收藏成功</strong>网页已保存，正在后台整理。</span></div><div className="skeleton-lines"><i /><i /><i /></div></Card>
          </div>
        </PreviewSection>
      </div>
    </div>
  );
}
