import { RiArrowUpDownLine, RiCloseLine, RiCommandLine, RiLayoutGridLine, RiListCheck3, RiPriceTag3Line, RiSearchLine } from "@remixicon/react";
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
import { inspirationItems, savedViews } from "@/src/data/demo";
import type { LibraryScope, SavedItem, SavedItemKind, SavedView } from "@/src/domain/inspiration";
import { normalizeUrl } from "@/src/capture/normalizeUrl";
import { DataImportDialog } from "./DataImportDialog";
import { DetailDialog } from "./DetailDialog";
import { ImportDialog } from "./ImportDialog";
import { SettingsDialog } from "./SettingsDialog";

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

export function LibraryPage() {
  const [items, setItems] = useState<SavedItem[]>(inspirationItems);
  const [views, setViews] = useState<SavedView[]>(savedViews);
  const [activeScope, setActiveScope] = useState<LibraryScope>("all");
  const [activeSavedView, setActiveSavedView] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("cards");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [importKind, setImportKind] = useState<SavedItemKind | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dataImportOpen, setDataImportOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

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
  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = items.filter((item) => {
      const scopeMatch = activeScope === "all" || activeScope === "favorites" || activeScope === "unprocessed"
        ? activeScope === "all" || (activeScope === "favorites" ? item.isFavorite : item.aiStatus !== "complete")
        : item.kind === activeScope;
      const viewMatch = !currentView || !currentView.tags || currentView.tags.every((tag) => item.tags.includes(tag));
      const text = [item.title, item.description, item.siteHost, ...item.tags].join(" ").toLowerCase();
      const queryMatch = !normalized || text.includes(normalized);
      const tagMatch = selectedTags.every((tag) => item.tags.includes(tag));
      return scopeMatch && viewMatch && queryMatch && tagMatch;
    });
    return sortOrder === "newest" ? filtered : [...filtered].reverse();
  }, [activeScope, currentView, items, query, selectedTags, sortOrder]);

  const viewTitle = currentView?.name ?? (activeScope === "all" ? "全部内容" : activeScope === "favorites" ? "星标" : activeScope === "unprocessed" ? "未处理" : kindLabels[activeScope]);
  const selectedItem = items.find((item) => item.id === selectedId) ?? null;
  const resetBrowseControls = () => { setSelectedTags([]); setSortOrder("newest"); };
  const changeScope = (scope: LibraryScope) => { setActiveScope(scope); setActiveSavedView(null); resetBrowseControls(); };
  const changeSavedView = (id: string) => {
    const view = views.find((candidate) => candidate.id === id);
    setActiveSavedView(id);
    setActiveScope(view?.scope ?? "all");
    setSelectedTags(view?.tags ?? []);
    setSortOrder("newest");
  };
  const renameSavedView = (id: string, name: string) => setViews((current) => current.map((view) => view.id === id && !view.isSystem ? { ...view, name } : view));
  const deleteSavedView = (id: string) => {
    setViews((current) => current.filter((view) => view.id !== id || view.isSystem));
    setActiveSavedView((current) => current === id ? null : current);
  };
  const moveSavedView = (sourceId: string, targetId: string) => {
    setViews((current) => {
      const systemViews = current.filter((view) => view.isSystem);
      const customViews = current.filter((view) => !view.isSystem);
      const sourceIndex = customViews.findIndex((view) => view.id === sourceId);
      if (sourceIndex < 0) return current;
      const [moved] = customViews.splice(sourceIndex, 1);
      if (!moved) return current;
      const targetIndex = targetId === systemViews[0]?.id ? 0 : customViews.findIndex((view) => view.id === targetId);
      customViews.splice(targetIndex < 0 ? customViews.length : targetIndex, 0, moved);
      return [...systemViews, ...customViews];
    });
  };
  const createSavedView = () => {
    const id = `saved-view-${Date.now()}`;
    const view: SavedView = { id, name: "新快捷视图", scope: activeScope, tags: selectedTags.length ? selectedTags : undefined };
    setViews((current) => [...current, view]);
    setActiveSavedView(id);
  };
  const toggleFavorite = (id: string) => setItems((current) => current.map((item) => item.id === id ? { ...item, isFavorite: !item.isFavorite } : item));

  function navigateDetail(direction: -1 | 1) {
    if (!selectedId || visibleItems.length === 0) return;
    const index = visibleItems.findIndex((item) => item.id === selectedId);
    const next = visibleItems[(index + direction + visibleItems.length) % visibleItems.length];
    if (next) setSelectedId(next.id);
  }

  function createPendingItem(kind: SavedItemKind, url: string, description = ""): SavedItem {
    const parsed = new URL(url);
    const userDescription = description.trim();
    return {
      id: `${kind}-${Date.now()}`,
      kind,
      title: parsed.hostname.replace(/^www\./, ""),
      siteHost: parsed.hostname.replace(/^www\./, ""),
      description: userDescription,
      descriptionSource: userDescription ? "user" : undefined,
      url,
      tags: [],
      savedAt: "刚刚",
      aiStatus: "pending",
      isFavorite: false,
      cover: { background: "var(--color-tag-surface)", foreground: "var(--color-brand)", label: kindLabels[kind], motif: kind === "follow" ? "orb" : "type" },
    };
  }

  function addItem({ kind, url, description }: { kind: SavedItemKind; url: string; description: string }) {
    const canonicalUrl = normalizeUrl(url);
    if (items.some((item) => item.kind === kind && normalizeUrl(item.url) === canonicalUrl)) return false;
    setItems((current) => [createPendingItem(kind, canonicalUrl, description), ...current]);
    changeScope(kind);
    return true;
  }

  function importItems(urls: string[]) {
    const existing = new Set(items.filter((item) => item.kind === "website").map((item) => normalizeUrl(item.url)));
    const additions: SavedItem[] = [];
    let skipped = 0;
    urls.forEach((url, index) => {
      const canonicalUrl = normalizeUrl(url);
      if (existing.has(canonicalUrl)) { skipped += 1; return; }
      existing.add(canonicalUrl);
      additions.push({ ...createPendingItem("website", canonicalUrl), id: `website-${Date.now()}-${index}` });
    });
    if (additions.length > 0) {
      setItems((current) => [...additions, ...current]);
      changeScope("website");
    }
    return { added: additions.length, skipped };
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

        {visibleItems.length ? <div className={layoutMode === "list" ? "inspiration-grid is-list" : "inspiration-grid"}>{visibleItems.map((item) => <InspirationCard key={item.id} item={item} layout={layoutMode} masonry={layoutMode === "cards"} onOpen={() => setSelectedId(item.id)} onTagClick={(tag) => { setSelectedTags((current) => current.includes(tag) ? current : [...current, tag]); setActiveSavedView(null); }} onToggleFavorite={() => toggleFavorite(item.id)} />)}</div> : <div className="empty-state"><div className="empty-mark"><RiSearchLine size={22} /></div><h2>没有匹配的内容</h2><p>调整筛选条件，或换一个搜索关键词后再试。</p><Button variant="secondary" onPress={clearConditions}>清除筛选</Button></div>}
      </div>
      <FloatingAddMenu onSelect={setImportKind} />
      <ImportDialog kind={importKind} onClose={() => setImportKind(null)} onAdd={addItem} />
      <SettingsDialog isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} onOpenImport={() => setDataImportOpen(true)} />
      <DataImportDialog isOpen={dataImportOpen} onClose={() => setDataImportOpen(false)} onImport={importItems} />
      <DetailDialog item={selectedItem} onClose={() => setSelectedId(null)} onNavigate={navigateDetail} />
    </AppShell>
  );
}
