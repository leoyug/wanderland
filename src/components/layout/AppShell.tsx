import { RiAddLine } from "@remixicon/react";
import type { ReactNode } from "react";
import type { LibraryScope, SavedItem, SavedItemKind, SavedView } from "@/src/domain/inspiration";
import { SavedViewNavItem } from "./SavedViewNavItem";
import { SidebarIcon } from "./SidebarIcon";
import { SidebarNavItem } from "./SidebarNavItem";

interface AppShellProps {
  items: SavedItem[];
  activeScope: LibraryScope;
  activeSavedView: string | null;
  savedViews: SavedView[];
  onScopeChange: (scope: LibraryScope) => void;
  onSavedViewChange: (viewId: string) => void;
  onSavedViewRename: (viewId: string, name: string) => void;
  onSavedViewDelete: (viewId: string) => void;
  onSavedViewMove: (sourceId: string, targetId: string) => void;
  onSavedViewCreate: () => void;
  onOpenSettings: () => void;
  children: ReactNode;
}

const iconPath = (name: string) => `/assets/sidebar/${name}.svg`;
const kindItems: Array<{ id: SavedItemKind; label: string; icon: string }> = [
  { id: "website", label: "网站", icon: iconPath("web") },
  { id: "article", label: "文章", icon: iconPath("article") },
  { id: "follow", label: "关注源", icon: iconPath("follow") },
];

export function AppShell({ items, activeScope, activeSavedView, savedViews, onScopeChange, onSavedViewChange, onSavedViewRename, onSavedViewDelete, onSavedViewMove, onSavedViewCreate, onOpenSettings, children }: AppShellProps) {
  const countForScope = (scope: LibraryScope) => scope === "all"
    ? items.length
    : scope === "favorites"
      ? items.filter((item) => item.isFavorite).length
      : scope === "unprocessed"
        ? items.filter((item) => item.aiStatus !== "complete").length
        : items.filter((item) => item.kind === scope).length;
  const renderScope = (scope: LibraryScope, label: string, icon: string) => <SidebarNavItem icon={<SidebarIcon src={icon} />} label={label} count={countForScope(scope)} isActive={activeScope === scope && !activeSavedView} onPress={() => onScopeChange(scope)} />;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><img className="brand-mark" src="/assets/logo.svg" alt="" /><span>Wanderland</span></div>
        <nav aria-label="收藏库导航" className="sidebar-navigation">
          <section><p className="nav-label">收藏库</p><div className="nav-list">{renderScope("all", "全部", iconPath("inbox"))}{renderScope("unprocessed", "未处理", iconPath("unprocessed"))}{renderScope("favorites", "星标", iconPath("bookmark"))}</div></section>
          <section><p className="nav-label">内容列表</p><div className="nav-list">{kindItems.map(({ id, label, icon }) => <span className="nav-entry" key={id}>{renderScope(id, label, icon)}</span>)}</div></section>
          <section className="saved-views-section"><div className="nav-section-heading"><p className="nav-label">快捷视图</p><button type="button" className="saved-view-add" aria-label="添加快捷视图" onClick={onSavedViewCreate}><RiAddLine size={15} /></button></div><div className="nav-list">
            {savedViews.map((view) => <SavedViewNavItem key={view.id} view={view} iconSrc={iconPath(view.isSystem ? "timer" : "lightbulb")} isActive={activeSavedView === view.id} onPress={() => onSavedViewChange(view.id)} onRename={(name) => onSavedViewRename(view.id, name)} onDelete={() => onSavedViewDelete(view.id)} onMove={(sourceId) => onSavedViewMove(sourceId, view.id)} />)}
          </div></section>
        </nav>
        <div className="sidebar-bottom">
          <SidebarNavItem className="sidebar-tool" icon={<SidebarIcon src={iconPath("settings")} />} label="设置" onPress={onOpenSettings} />
          <p className="sidebar-copyright">© 2026 Wanderland</p>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
