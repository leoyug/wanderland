import { RiApps2Line, RiArticleLine, RiCompass3Line, RiFolder3Line, RiSettings3Line, RiUser3Line } from "@remixicon/react";
import type { ReactNode } from "react";
import { Button } from "@/src/components/ui/Button";
import type { Channel } from "@/src/domain/inspiration";
import { cn } from "@/src/lib/cn";

interface AppShellProps {
  channels: Channel[];
  activeChannel: string;
  onChannelChange: (channel: string) => void;
  children: ReactNode;
  onOpenDesignSystem: () => void;
}

export function AppShell({ channels, activeChannel, onChannelChange, children, onOpenDesignSystem }: AppShellProps) {
  const groups = ["网页", "文章", "关注"] as const;
  const icons = { "网页": RiCompass3Line, "文章": RiArticleLine, "关注": RiUser3Line };

  const renderChannels = (items: Channel[]) => items.map((channel) => (
    <button
      type="button"
      key={channel.id}
      onClick={() => onChannelChange(channel.id)}
      className={cn("channel-item", activeChannel === channel.id && "is-active")}
    >
      {(() => { const Icon = icons[channel.group]; return <Icon size={16} aria-hidden="true" />; })()}
      <span>{channel.name}</span>
    </button>
  ));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img className="brand-mark" src="/assets/logo.svg" alt="" />
          <span>Wanderly</span>
        </div>

        <nav aria-label="灵感库导航" className="sidebar-navigation">
          {groups.map((group) => <section key={group}><p className="nav-label">{group}</p><div className="channel-list">{renderChannels(channels.filter((channel) => channel.group === group))}</div></section>)}
        </nav>

        <div className="sidebar-bottom">
          <Button variant="ghost" className="sidebar-tool"><RiFolder3Line size={17} />导入收藏</Button>
          {import.meta.env.DEV && (
            <Button variant="ghost" className="sidebar-tool" onPress={onOpenDesignSystem}><RiApps2Line size={17} />设计系统</Button>
          )}
          <Button variant="ghost" className="sidebar-tool"><RiSettings3Line size={17} />设置</Button>
          <p className="sidebar-copyright">© 2026 Wanderly</p>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
