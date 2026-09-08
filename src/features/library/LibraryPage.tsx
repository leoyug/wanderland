import { RiArrowUpDownLine, RiCloseLine, RiCommandLine, RiLayoutGridLine, RiListCheck3, RiPriceTag3Line, RiSearchLine } from "@remixicon/react";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useMemo, useRef, useState } from "react";
import { Input, SearchField } from "react-aria-components";
import { FloatingAddMenu } from "@/src/components/inspiration/FloatingAddMenu";
import { InspirationCard, type InspirationLayout } from "@/src/components/inspiration/InspirationCard";
import { AppShell } from "@/src/components/layout/AppShell";
import { Button } from "@/src/components/ui/Button";
import { FacetFilter } from "@/src/components/ui/FacetFilter";
import { SegmentedControl } from "@/src/components/ui/SegmentedControl";
import { SelectMenu } from "@/src/components/ui/SelectMenu";
import { SelectedTagBar } from "@/src/components/ui/SelectedTagBar";
import { seedDevelopmentData } from "@/src/db/developmentSeed";
import { inspirationRepository } from "@/src/db/repository";
import { isSavedItemProcessed, type LibraryScope, type SavedItemKind } from "@/src/domain/inspiration";
import { createLibrarySearchIndex } from "@/src/search/librarySearch";
import { DataImportDialog } from "./DataImportDialog";
import { DetailDialog } from "./DetailDialog";
import { ImportDialog } from "./ImportDialog";
import { SettingsDialog } from "./SettingsDialog";
import { TagManagerDialog } from "./TagManagerDialog";

type LayoutMode = InspirationLayout;
type SortOrder = "newest" | "oldest";
const kindLabels = { website: "网站", article: "文章", follow: "关注源" } as const;
const layoutOptions = [
  { value: "cards", label: "卡片排列", icon: <RiLayoutGridLine size={15} aria-hidden="true" /> },
  { value: "list", label: "列表排列", icon: <RiListCheck3 size={15} aria-hidden="true" /> },
] as const;
const sortOptions = [
  { value: "newest", label: "最新" },
  { value: "oldest", label: "最旧" },
] as const;

const validScopes = new Set<LibraryScope>(["all", "unprocessed", "favorites", "website", "article", "follow"]);

function readInitialState() {
  const params = new URLSearchParams(location.search);
  const scope = params.get("scope") as LibraryScope | null;
  return {
    scope: scope && validScopes.has(scope) ? scope : "all" as LibraryScope,
    query: params.get("q") ?? "",
    tags: params.getAll("tag"),
    sort: params.get("sort") === "oldest" ? "oldest" as const : "newest" as const,
    layout: params.get("layout") === "list" ? "list" as const : "cards" as const,
    item: params.get("item"),
    view: params.get("view"),
  };
}

export function LibraryPage() {
  const initialState = useMemo(readInitialState, []);
  const liveItems = useLiveQuery(() => inspirationRepository.listLibraryItems(), []);
  const liveViews = useLiveQuery(() => inspirationRepository.listLibrarySavedViews(), []);
  const items = liveItems ?? [];
  const views = liveViews ?? [];
  const [activeScope, setActiveScope] = useState<LibraryScope>(initialState.scope);
  const [activeSavedView, setActiveSavedView] = useState<string | null>(initialState.view);
  const [query, setQuery] = useState(initialState.query);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialState.tags);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialState.sort);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(initialState.layout);
  const [selectedId, setSelectedId] = useState<string | null>(initialState.item);
  const [importKind, setImportKind] = useState<SavedItemKind | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dataImportOpen, setDataImportOpen] = useState(false);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const detailTriggerRef = useRef<HTMLElement | null>(null);
  const detailScrollRef = useRef(0);

  useEffect(() => {
    // URL 同步 effect 会在挂载后重写地址栏，必须在它之前同步读取 seed 参数
    const shouldSeed = new URLSearchParams(window.location.search).get("seed") === "demo";
    void inspirationRepository.initialize().then(() => seedDevelopmentData(inspirationRepository, shouldSeed));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (activeScope !== "all") params.set("scope", activeScope);
    selectedTags.forEach((tag) => params.append("tag", tag));
    if (sortOrder !== "newest") params.set("sort", sortOrder);
    if (layoutMode !== "cards") params.set("layout", layoutMode);
    if (selectedId) params.set("item", selectedId);
    if (activeSavedView) params.set("view", activeSavedView);
    const next = params.size ? `?${params}` : location.pathname;
    history.replaceState(null, "", next);
  }, [activeSavedView, activeScope, layoutMode, query, selectedId, selectedTags, sortOrder]);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((item) => item.tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1)));
    return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN"));
  }, [items]);

  const currentView = views.find((view) => view.id === activeSavedView) ?? null;
  const searchIndex = useMemo(() => createLibrarySearchIndex(items), [items]);
  const searchMatches = useMemo(() => searchIndex.search(query), [query, searchIndex]);
  const visibleItems = useMemo(() => {
    const filtered = items.filter((item) => {
      const scopeMatch = activeScope === "all" || activeScope === "favorites" || activeScope === "unprocessed"
        ? activeScope === "all" || (activeScope === "favorites" ? item.isFavorite : !isSavedItemProcessed(item))
        : item.kind === activeScope;
      const viewMatch = !currentView || !currentView.tags || currentView.tags.every((tag) => item.tags.includes(tag));
      const queryMatch = searchMatches.has(item.id);
      const tagMatch = selectedTags.every((tag) => item.tags.includes(tag));
      return scopeMatch && viewMatch && queryMatch && tagMatch;
    });
    return [...filtered].sort((a, b) => sortOrder === "newest" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt);
  }, [activeScope, currentView, items, searchMatches, selectedTags, sortOrder]);

  const viewTitle = currentView?.name ?? (activeScope === "all" ? "全部内容" : activeScope === "favorites" ? "星标" : activeScope === "unprocessed" ? "未处理" : kindLabels[activeScope]);
  const selectedItem = items.find((item) => item.id === selectedId) ?? null;
  const selectedSiteItemCount = selectedItem ? items.filter((item) => item.siteHost === selectedItem.siteHost).length : 0;
  const resetBrowseControls = () => { setSelectedTags([]); setSortOrder("newest"); };
  const changeScope = (scope: LibraryScope) => { setActiveScope(scope); setActiveSavedView(null); resetBrowseControls(); };
  const changeSavedView = (id: string) => {
    const view = views.find((candidate) => candidate.id === id);
    setActiveSavedView(id);
    setActiveScope(view?.scope ?? "all");
    setSelectedTags(view?.tags ?? []);
    setSortOrder("newest");
  };
  const renameSavedView = (id: string, name: string) => { void inspirationRepository.renameSavedView(id, name); };
  const deleteSavedView = (id: string) => {
    void inspirationRepository.deleteSavedView(id);
    setActiveSavedView((current) => current === id ? null : current);
  };
  const moveSavedView = (sourceId: string, targetId: string) => {
    void inspirationRepository.moveSavedView(sourceId, targetId);
  };
  const createSavedView = async () => {
    const view = await inspirationRepository.createSavedView({ name: "新快捷视图", scope: activeScope, tags: selectedTags });
    setActiveSavedView(view.id);
  };
  const toggleFavorite = (id: string) => { void inspirationRepository.toggleFavorite(id); };

  function navigateDetail(direction: -1 | 1) {
    if (!selectedId || visibleItems.length === 0) return;
    const index = visibleItems.findIndex((item) => item.id === selectedId);
    const next = visibleItems[(index + direction + visibleItems.length) % visibleItems.length];
    if (next) setSelectedId(next.id);
  }

  function openDetail(id: string) {
    detailTriggerRef.current = document.activeElement as HTMLElement | null;
    detailScrollRef.current = window.scrollY;
    setSelectedId(id);
  }

  function closeDetail() {
    setSelectedId(null);
    requestAnimationFrame(() => {
      window.scrollTo({ top: detailScrollRef.current });
      detailTriggerRef.current?.focus({ preventScroll: true });
    });
  }

  async function addItem({ kind, url, description }: { kind: SavedItemKind; url: string; description: string }) {
    const result = await inspirationRepository.createSavedItem({ kind, url, description, captureMethod: "manual-url" });
    if (!result.created) return false;
    changeScope(kind);
    return true;
  }

  async function importItems(urls: string[]) {
    const result = await inspirationRepository.importWebsiteUrls(urls);
    if (result.added > 0) {
      changeScope("website");
    }
    return result;
  }

  const clearConditions = () => { setQuery(""); setSelectedTags([]); setActiveSavedView(null); };
  const removeTag = (tag: string) => { setSelectedTags((current) => current.filter((value) => value !== tag)); setActiveSavedView(null); };

  return (
    <AppShell items={items} activeScope={activeScope} activeSavedView={activeSavedView} savedViews={views} onScopeChange={changeScope} onSavedViewChange={changeSavedView} onSavedViewRename={renameSavedView} onSavedViewDelete={deleteSavedView} onSavedViewMove={moveSavedView} onSavedViewCreate={createSavedView} onOpenSettings={() => setSettingsOpen(true)}>
      <div className="library-page">
        <header className="library-intro">
          <SearchField className="library-search" value={query} onChange={setQuery} aria-label="搜索收藏项">
            <RiSearchLine size={20} aria-hidden="true" /><Input ref={searchRef} placeholder="搜索设计、创意或关键词……" />
            {query ? <Button variant="ghost" size="icon" aria-label="清除搜索" onPress={() => setQuery("")}><RiCloseLine size={15} /></Button> : <span className="shortcut"><RiCommandLine size={12} /> K</span>}
          </SearchField>
        </header>

        <div className="collection-toolbar">
          <div className="toolbar-main-row">
            <div className="toolbar-left">
              <div className="view-heading"><strong>{viewTitle}</strong><span>{visibleItems.length}</span></div>
              <div className="facet-filter-bar" aria-label="内容筛选">
                <FacetFilter label="标签" icon={<RiPriceTag3Line size={15} aria-hidden="true" />} options={allTags.map((tag) => ({ id: tag.name, label: `#${tag.name}`, count: tag.count }))} selectedValues={selectedTags} onChange={(values) => { setSelectedTags(values); setActiveSavedView(null); }} searchable searchPlaceholder="搜索标签" />
              </div>
            </div>
            <div className="toolbar-right">
              <SelectMenu label="排序方式" value={sortOrder} options={sortOptions} onChange={setSortOrder} icon={<RiArrowUpDownLine size={15} aria-hidden="true" />} className="sort-control" />
              <SegmentedControl label="排列样式" value={layoutMode} options={layoutOptions} onChange={setLayoutMode} className="layout-switch" />
            </div>
          </div>
          {selectedTags.length ? <SelectedTagBar tags={selectedTags} onRemove={removeTag} actions={<div className="filter-result-actions"><Button variant="secondary" size="sm" onPress={createSavedView}>保存为快捷视图</Button><Button variant="ghost" size="sm" onPress={clearConditions}>清除全部</Button></div>} /> : null}
        </div>

        {liveItems === undefined ? <div className="empty-state" aria-live="polite"><div className="empty-mark"><RiSearchLine size={22} /></div><h2>正在打开本地收藏库</h2><p>收藏项会在读取完成后自动出现。</p></div> : visibleItems.length ? <div className={layoutMode === "list" ? "inspiration-grid is-list" : "inspiration-grid"}>{visibleItems.map((item) => <InspirationCard key={item.id} item={item} layout={layoutMode} masonry={layoutMode === "cards"} onOpen={() => openDetail(item.id)} onTagClick={(tag) => { setSelectedTags((current) => current.includes(tag) ? current : [...current, tag]); setActiveSavedView(null); }} onToggleFavorite={() => toggleFavorite(item.id)} />)}</div> : items.length === 0 ? <div className="empty-state"><div className="empty-mark"><RiPriceTag3Line size={22} /></div><h2>建立你的第一个收藏项</h2><p>添加网站、文章或关注源，刷新页面后它仍会留在这里。</p><Button variant="primary" onPress={() => setImportKind("website")}>添加网站</Button></div> : <div className="empty-state"><div className="empty-mark"><RiSearchLine size={22} /></div><h2>没有匹配的内容</h2><p>调整筛选条件，或换一个搜索关键词后再试。</p><Button variant="secondary" onPress={clearConditions}>清除筛选</Button></div>}
      </div>
      <FloatingAddMenu onSelect={setImportKind} />
      <ImportDialog kind={importKind} onClose={() => setImportKind(null)} onAdd={addItem} />
      <SettingsDialog isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} onOpenImport={() => setDataImportOpen(true)} onOpenTags={() => setTagManagerOpen(true)} />
      <TagManagerDialog isOpen={tagManagerOpen} onClose={() => setTagManagerOpen(false)} />
      <DataImportDialog isOpen={dataImportOpen} onClose={() => setDataImportOpen(false)} onImport={importItems} />
      <DetailDialog item={selectedItem} onClose={closeDetail} onNavigate={navigateDetail} onUpdate={(input) => inspirationRepository.updateSavedItem(selectedItem!.id, input)} onDelete={async () => { if (!selectedItem) return; await inspirationRepository.deleteSavedItem(selectedItem.id); closeDetail(); }} siteItemCount={selectedSiteItemCount} onShowSite={() => { if (!selectedItem) return; setQuery(selectedItem.siteHost); setActiveScope("all"); setSelectedTags([]); closeDetail(); }} />
    </AppShell>
  );
}
