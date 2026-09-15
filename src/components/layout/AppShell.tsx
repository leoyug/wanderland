import { RiArrowDownSLine, RiArchiveLine, RiArticleLine, RiFileMarkedLine, RiPaletteLine, RiPriceTag3Line, RiShieldCheckLine, RiSparkling2Line } from "@remixicon/react";
import { useLayoutEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
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
  onOpenBookmarks: () => void;
  onOpenTags: () => void;
  onOpenAi: () => void;
  onOpenArchive: () => void;
  onOpenBackup: () => void;
  children: ReactNode;
}

const iconPath = (name: string) => `/assets/sidebar/${name}.svg`;
const kindItems: Array<{ id: SavedItemKind; label: string; icon: string }> = [
  { id: "website", label: "网站", icon: iconPath("web") },
  { id: "article", label: "文章", icon: iconPath("article") },
  { id: "follow", label: "关注源", icon: iconPath("follow") },
];

export function AppShell({ items, activeScope, activeSavedView, savedViews, onScopeChange, onSavedViewChange, onSavedViewRename, onSavedViewDelete, onSavedViewMove, onOpenBookmarks, onOpenTags, onOpenAi, onOpenArchive, onOpenBackup, children }: AppShellProps) {
  const [areSavedViewsExpanded, setAreSavedViewsExpanded] = useState(true);
  const navigationRef = useRef<HTMLElement>(null);
  const scrollbarDragRef = useRef<{ pointerId: number; offset: number } | null>(null);
  const [sidebarScrollbar, setSidebarScrollbar] = useState({ isVisible: false, top: 0, height: 72 });

  const syncSidebarScrollbar = () => {
    const navigation = navigationRef.current;
    if (!navigation) return;
    const trackHeight = Math.max(0, navigation.clientHeight - 12);
    const maxScroll = navigation.scrollHeight - navigation.clientHeight;
    const isVisible = maxScroll > 1 && trackHeight > 0;
    const height = Math.min(trackHeight, Math.max(32, trackHeight * (navigation.clientHeight / navigation.scrollHeight)));
    const top = isVisible && maxScroll > 0 ? (navigation.scrollTop / maxScroll) * (trackHeight - height) : 0;
    setSidebarScrollbar((current) => current.isVisible === isVisible && current.top === top && current.height === height ? current : { isVisible, top, height });
  };

  useLayoutEffect(() => {
    const navigation = navigationRef.current;
    if (!navigation) return;
    const frame = requestAnimationFrame(syncSidebarScrollbar);
    const completionFrame = window.setTimeout(syncSidebarScrollbar, 260);
    const observer = new ResizeObserver(syncSidebarScrollbar);
    observer.observe(navigation);
    navigation.addEventListener("scroll", syncSidebarScrollbar, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(completionFrame);
      observer.disconnect();
      navigation.removeEventListener("scroll", syncSidebarScrollbar);
    };
  }, [areSavedViewsExpanded, savedViews.length]);

  const moveSidebarScrollbar = (clientY: number, offset: number, track: HTMLDivElement) => {
    const navigation = navigationRef.current;
    if (!navigation) return;
    const trackBounds = track.getBoundingClientRect();
    const availableDistance = Math.max(0, trackBounds.height - sidebarScrollbar.height);
    const nextTop = Math.min(availableDistance, Math.max(0, clientY - trackBounds.top - offset));
    const maxScroll = navigation.scrollHeight - navigation.clientHeight;
    navigation.scrollTop = availableDistance > 0 ? (nextTop / availableDistance) * maxScroll : 0;
  };

  const handleScrollbarPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const isThumb = event.target instanceof HTMLElement && event.target.classList.contains("sidebar-scrollbar-thumb");
    const offset = isThumb ? event.clientY - event.currentTarget.getBoundingClientRect().top - sidebarScrollbar.top : sidebarScrollbar.height / 2;
    scrollbarDragRef.current = { pointerId: event.pointerId, offset };
    event.currentTarget.setPointerCapture(event.pointerId);
    moveSidebarScrollbar(event.clientY, offset, event.currentTarget);
  };

  const handleScrollbarPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = scrollbarDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    moveSidebarScrollbar(event.clientY, drag.offset, event.currentTarget);
  };

  const stopScrollbarDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (scrollbarDragRef.current?.pointerId === event.pointerId) scrollbarDragRef.current = null;
  };
  const activeItems = items.filter((item) => !item.archivedAt);
  const countForScope = (scope: LibraryScope) => scope === "all"
    ? activeItems.length
    : scope === "favorites"
      ? activeItems.filter((item) => item.isFavorite).length
      : scope === "unprocessed"
        ? activeItems.filter((item) => !isSavedItemProcessed(item)).length
        : activeItems.filter((item) => item.kind === scope).length;
  const renderScope = (scope: LibraryScope, label: string, icon: string) => <SidebarNavItem icon={<SidebarIcon src={icon} />} label={label} count={countForScope(scope)} isActive={activeScope === scope && !activeSavedView} onPress={() => onScopeChange(scope)} />;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><img className="brand-mark" src="/assets/logo.svg" alt="" /><span>Wanderland</span></div>
        <div className="sidebar-navigation-wrap">
        <nav ref={navigationRef} aria-label="收藏库导航" className="sidebar-navigation">
          <section><p className="nav-label">收藏库</p><div className="nav-list">{renderScope("all", "全部", iconPath("inbox"))}{renderScope("unprocessed", "未处理", iconPath("unprocessed"))}{renderScope("favorites", "星标", iconPath("bookmark"))}</div></section>
          <section><p className="nav-label">内容列表</p><div className="nav-list">{kindItems.map(({ id, label, icon }) => <span className="nav-entry" key={id}>{renderScope(id, label, icon)}</span>)}</div></section>
          <section className="saved-views-section t-acc" data-open={areSavedViewsExpanded}><div className="nav-section-heading"><p className="nav-label">快捷视图</p><button type="button" className="saved-view-toggle t-acc-head" aria-label={areSavedViewsExpanded ? "收起快捷视图" : "展开快捷视图"} aria-expanded={areSavedViewsExpanded} onClick={() => setAreSavedViewsExpanded((isExpanded) => !isExpanded)}><span className="t-acc-chevron"><RiArrowDownSLine size={18} /></span></button></div><div className="saved-views-panel t-acc-panel"><div className="saved-views-panel-inner t-acc-panel-inner"><div className="nav-list">
            {savedViews.map((view) => <SavedViewNavItem key={view.id} view={view} iconSrc={iconPath(view.isSystem ? "timer" : "lightbulb")} isActive={activeSavedView === view.id} onPress={() => onSavedViewChange(view.id)} onRename={(name) => onSavedViewRename(view.id, name)} onDelete={() => onSavedViewDelete(view.id)} onMove={(sourceId) => onSavedViewMove(sourceId, view.id)} />)}
          </div></div></div></section>
        </nav>
        {sidebarScrollbar.isVisible ? <div className="sidebar-scrollbar" aria-hidden="true" onPointerDown={handleScrollbarPointerDown} onPointerMove={handleScrollbarPointerMove} onPointerUp={stopScrollbarDrag} onPointerCancel={stopScrollbarDrag}><div className="sidebar-scrollbar-thumb" style={{ height: sidebarScrollbar.height, transform: `translateY(${sidebarScrollbar.top}px)` }} /></div> : null}
        </div>
        <div className="sidebar-bottom">
          <Menu>
            <Button variant="ghost" className="nav-item sidebar-tool" aria-label="打开设置菜单"><SidebarIcon src={iconPath("settings")} /><span>设置</span></Button>
            <MenuContent aria-label="设置菜单">
              <MenuItem id="bookmarks" onAction={onOpenBookmarks}><RiFileMarkedLine size={16} aria-hidden="true" /><span>导入书签</span></MenuItem>
              <MenuItem id="tags" onAction={onOpenTags}><RiPriceTag3Line size={16} aria-hidden="true" /><span>管理标签</span></MenuItem>
              <MenuItem id="ai" onAction={onOpenAi}><RiSparkling2Line size={16} aria-hidden="true" /><span>AI 助手</span></MenuItem>
              <MenuItem id="backup" onAction={onOpenBackup}><RiShieldCheckLine size={16} aria-hidden="true" /><span>备份与恢复</span></MenuItem>
              <MenuItem id="archive" className="menu-item-separated" onAction={onOpenArchive}><RiArchiveLine size={16} aria-hidden="true" /><span>归档</span><small>{items.filter((item) => item.archivedAt).length || undefined}</small></MenuItem>
              <MenuItem id="appearance" isDisabled><RiPaletteLine size={16} aria-hidden="true" /><span>外观</span><small>后续</small></MenuItem>
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
