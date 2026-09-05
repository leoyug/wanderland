import { RiCloseLine, RiCommandLine, RiFilter3Line, RiLayoutGridLine, RiListCheck3, RiSearchLine } from "@remixicon/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Input, SearchField } from "react-aria-components";
import { AppShell } from "@/src/components/layout/AppShell";
import { InspirationCard } from "@/src/components/inspiration/InspirationCard";
import { Button } from "@/src/components/ui/Button";
import { channels, inspirationItems } from "@/src/data/demo";
import { cn } from "@/src/lib/cn";
import { DetailDialog } from "./DetailDialog";

type CollectionView = "all" | "organized";
type GridDensity = "comfortable" | "compact";

export function LibraryPage({ onOpenDesignSystem }: { onOpenDesignSystem: () => void }) {
  const [activeChannel, setActiveChannel] = useState("all");
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [collectionView, setCollectionView] = useState<CollectionView>("all");
  const [gridDensity, setGridDensity] = useState<GridDensity>("comfortable");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return inspirationItems.filter((item) => {
      const channelMatch = activeChannel === "all" || (activeChannel === "pending" ? item.aiStatus !== "complete" : item.channelIds.includes(activeChannel));
      const collectionMatch = collectionView === "all" || item.aiStatus === "complete";
      const text = [item.title, item.description, item.siteHost, item.note, ...item.tags].join(" ").toLowerCase();
      const queryMatch = !normalized || text.includes(normalized);
      const filterMatch = !activeFilter ||
        (activeFilter === "待处理" && item.aiStatus !== "complete") ||
        (activeFilter === "有备注" && Boolean(item.note)) || activeFilter === "最近收藏";
      return channelMatch && collectionMatch && queryMatch && filterMatch;
    });
  }, [activeChannel, activeFilter, collectionView, query]);

  const selectedItem = inspirationItems.find((item) => item.id === selectedId) ?? null;
  function navigateDetail(direction: -1 | 1) {
    if (!selectedId || visibleItems.length === 0) return;
    const index = visibleItems.findIndex((item) => item.id === selectedId);
    const next = visibleItems[(index + direction + visibleItems.length) % visibleItems.length];
    if (next) setSelectedId(next.id);
  }

  const clearConditions = () => {
    setQuery("");
    setActiveFilter(null);
    setCollectionView("all");
  };

  return (
    <AppShell channels={channels} activeChannel={activeChannel} onChannelChange={setActiveChannel} onOpenDesignSystem={onOpenDesignSystem}>
      <div className="library-page">
        <header className="library-intro">
          <SearchField className="library-search" value={query} onChange={setQuery} aria-label="搜索灵感">
            <RiSearchLine size={18} aria-hidden="true" />
            <Input ref={searchRef} placeholder="Search designs, creatives, or keywords..." />
            {query ? (
              <Button variant="ghost" size="icon" aria-label="清除搜索" onPress={() => setQuery("")}><RiCloseLine size={15} /></Button>
            ) : (
              <span className="shortcut"><RiCommandLine size={12} /> K</span>
            )}
          </SearchField>
          <p>发现看到的美好</p>
        </header>

        <div className="collection-toolbar">
          <div className="toolbar-left">
            <div className="segmented-control" aria-label="收藏范围">
              <button type="button" aria-pressed={collectionView === "all"} onClick={() => setCollectionView("all")}>All <span>{inspirationItems.length}</span></button>
              <button type="button" aria-pressed={collectionView === "organized"} onClick={() => setCollectionView("organized")}>Saved <span>{inspirationItems.filter((item) => item.aiStatus === "complete").length}</span></button>
            </div>
            <Button variant={activeFilter ? "secondary" : "ghost"} size="icon" aria-label="筛选收藏" onPress={() => setActiveFilter(activeFilter ? null : "最近收藏")}><RiFilter3Line size={16} /></Button>
          </div>

          <div className="toolbar-right">
            <span className="updated-at">Last updated: 3 hours ago</span>
            <div className="density-control" aria-label="卡片密度">
              <button type="button" aria-pressed={gridDensity === "comfortable"} aria-label="舒展网格" onClick={() => setGridDensity("comfortable")}><RiLayoutGridLine size={16} /></button>
              <button type="button" aria-pressed={gridDensity === "compact"} aria-label="紧凑列表" onClick={() => setGridDensity("compact")}><RiListCheck3 size={16} /></button>
            </div>
          </div>
        </div>

        {visibleItems.length ? (
          <div className={cn("inspiration-grid", gridDensity === "compact" && "is-compact")}>
            {visibleItems.map((item) => <InspirationCard key={item.id} item={item} masonry onOpen={() => setSelectedId(item.id)} onTagClick={setQuery} />)}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-mark"><RiSearchLine size={22} /></div>
            <h2>没有匹配的灵感</h2>
            <p>换一个关键词，或清除筛选条件后再试。</p>
            <Button variant="secondary" onPress={clearConditions}>清除条件</Button>
          </div>
        )}
      </div>
      <DetailDialog item={selectedItem} onClose={() => setSelectedId(null)} onNavigate={navigateDetail} />
    </AppShell>
  );
}
