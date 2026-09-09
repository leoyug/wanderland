import { RiAddLine, RiArticleLine, RiDownloadLine, RiPaletteLine, RiPriceTag3Line, RiSparkling2Line } from "@remixicon/react";
import type { ReactNode } from "react";
import { isSavedItemProcessed, type LibraryItem, type LibrarySavedView, type LibraryScope, type SavedItemKind } from "@/src/domain/inspiration";
import { SavedViewNavItem } from "./SavedViewNavItem";
import { SidebarIcon } from "./SidebarIcon";
import { SidebarNavItem } from "./SidebarNavItem";
import { Button } from "@/src/components/ui/Button";
import { Menu, MenuContent, MenuItem } from "@/src/components/ui/Menu";

interface AppShellProps {
  items: LibraryItem[];
  activeScope: LibraryScope;
  activeSavedView: string | null;
  savedViews: LibrarySavedView[];
  onScopeChange: (scope: LibraryScope) => void;
  onSavedViewChange: (viewId: string) => void;
  onSavedViewRename: (viewId: string, name: string) => void;
  onSavedViewDelete: (viewId: string) => void;
  onSavedViewMove: (sourceId: string, targetId: string) => void;
  onSavedViewCreate: () => void;
  onOpenImport: () => void;
  onOpenTags: () => void;
  onOpenAi: () => void;
  children: ReactNode;
}

const iconPath = (name: string) => `/assets/sidebar/${name}.svg`;
const kindItems: Array<{ id: SavedItemKind; label: string; icon: string }> = [
  { id: "website", label: "网站", icon: iconPath("web") },
  { id: "article", label: "文章", icon: iconPath("article") },
  { id: "follow", label: "关注源", icon: iconPath("follow") },
];

export function AppShell({ items, activeScope, activeSavedView, savedViews, onScopeChange, onSavedViewChange, onSavedViewRename, onSavedViewDelete, onSavedViewMove, onSavedViewCreate, onOpenImport, onOpenTags, onOpenAi, children }: AppShellProps) {
  const countForScope = (scope: LibraryScope) => scope === "all"
    ? items.length
    : scope === "favorites"
      ? items.filter((item) => item.isFavorite).length
      : scope === "unprocessed"
        ? items.filter((item) => !isSavedItemProcessed(item)).length
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
          <Menu>
            <Button variant="ghost" className="nav-item sidebar-tool" aria-label="打开设置菜单"><SidebarIcon src={iconPath("settings")} /><span>设置</span></Button>
            <MenuContent aria-label="设置菜单">
              <MenuItem id="import" onAction={onOpenImport}><RiDownloadLine size={16} aria-hidden="true" /><span>导入收藏</span></MenuItem>
              <MenuItem id="tags" onAction={onOpenTags}><RiPriceTag3Line size={16} aria-hidden="true" /><span>管理标签</span></MenuItem>
              <MenuItem id="ai" onAction={onOpenAi}><RiSparkling2Line size={16} aria-hidden="true" /><span>AI 助手</span></MenuItem>
              <MenuItem id="appearance" className="menu-item-separated" isDisabled><RiPaletteLine size={16} aria-hidden="true" /><span>外观</span><small>后续</small></MenuItem>
              <MenuItem id="digest" isDisabled><RiArticleLine size={16} aria-hidden="true" /><span>内容简报</span><small>后续</small></MenuItem>
            </MenuContent>
          </Menu>
          <p className="sidebar-copyright">© 2026 Wanderland</p>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
