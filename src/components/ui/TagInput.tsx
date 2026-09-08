import { RiCloseLine } from "@remixicon/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import type { Tag } from "@/src/domain/inspiration";

interface TagInputProps {
  label: string;
  tags: string[];
  options: Tag[];
  onChange: (tags: string[]) => void;
  placement?: "auto" | "bottom";
}

const normalize = (value: string) => value.trim().replace(/^#/, "").normalize("NFKC");

export function TagInput({ label, tags, options, onChange, placement = "auto" }: TagInputProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [popoverStyle, setPopoverStyle] = useState<{ left: number; top: number; width: number; maxHeight: number }>();
  const available = useMemo(() => options.filter((option) => !tags.some((tag) => tag.toLocaleLowerCase("zh-CN") === option.name.toLocaleLowerCase("zh-CN"))), [options, tags]);
  const recent = useMemo(() => [...available].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4), [available]);
  const matches = useMemo(() => {
    const needle = normalize(query).toLocaleLowerCase("zh-CN");
    return needle ? available.filter((option) => option.name.toLocaleLowerCase("zh-CN").includes(needle)) : [];
  }, [available, query]);
  const canCreate = Boolean(normalize(query)) && !options.some((option) => option.name.toLocaleLowerCase("zh-CN") === normalize(query).toLocaleLowerCase("zh-CN"));
  const actionable = query.trim() ? [...matches.map((tag) => tag.name), ...(canCreate ? [normalize(query)] : [])] : [...recent.map((tag) => tag.name), ...available.map((tag) => tag.name)];
  const portalHost = rootRef.current?.closest(".detail-modal") ?? document.body;

  useEffect(() => {
    if (!open) return;
    const position = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      const gap = 6;
      const viewportPadding = 8;
      const roomBelow = window.innerHeight - rect.bottom - viewportPadding;
      const roomAbove = rect.top - viewportPadding;
      const optionCount = query.trim() ? matches.length + (canCreate ? 1 : 0) : recent.length + available.length;
      const sectionHeight = query.trim() ? 16 : (recent.length ? 32 : 0) + (available.length ? 32 : 0);
      const desiredHeight = Math.min(320, Math.max(54, optionCount * 38 + sectionHeight + 16));
      const placeAbove = placement === "auto" && roomBelow < desiredHeight && roomAbove > roomBelow;
      const maxHeight = Math.min(320, Math.max(54, placeAbove ? roomAbove - gap : roomBelow - gap));
      setPopoverStyle({ left: rect.left, top: placeAbove ? Math.max(viewportPadding, rect.top - maxHeight - gap) : rect.bottom + gap, width: rect.width, maxHeight });
    };
    position();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [available.length, canCreate, matches.length, open, placement, query, recent.length]);

  useEffect(() => {
    const popover = popoverRef.current;
    if (!open || !popover) return;
    const containWheel = (event: WheelEvent) => {
      event.preventDefault();
      event.stopPropagation();
      popover.scrollTop = Math.max(0, Math.min(popover.scrollHeight - popover.clientHeight, popover.scrollTop + event.deltaY));
    };
    popover.addEventListener("wheel", containWheel, { passive: false, capture: true });
    return () => popover.removeEventListener("wheel", containWheel, { capture: true });
  }, [open, popoverStyle]);

  const add = (name: string) => {
    const next = normalize(name);
    if (!next) return;
    onChange([...tags, next]);
    setQuery("");
    setActiveIndex(-1);
    setHoveredIndex(-1);
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => event.key === "ArrowDown"
        ? Math.min(actionable.length - 1, current + 1)
        : current < 0 ? actionable.length - 1 : Math.max(0, current - 1));
    } else if (event.key === "Enter" && query.trim()) {
      const selected = actionable[activeIndex < 0 ? 0 : activeIndex];
      if (!selected) return;
      event.preventDefault();
      add(selected);
    } else if (event.key === "Backspace" && !query && tags.length) {
      onChange(tags.slice(0, -1));
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return <div className="tag-input" ref={rootRef} onBlur={(event) => { if (!rootRef.current?.contains(event.relatedTarget as Node)) setOpen(false); }}>
    <span className="tag-input-label">{label}</span>
    <div className="tag-input-control" onClick={() => inputRef.current?.focus()}>
      {tags.map((tag) => <button key={tag} type="button" className="tag-input-chip" onClick={(event) => { event.stopPropagation(); onChange(tags.filter((item) => item !== tag)); }}>#{tag}<RiCloseLine size={13} /></button>)}
      <input ref={inputRef} value={query} onFocus={() => { setActiveIndex(-1); setOpen(true); }} onChange={(event) => { setQuery(event.target.value); setActiveIndex(-1); setOpen(true); }} onKeyDown={onKeyDown} placeholder={tags.length ? "继续添加" : "添加标签"} aria-label={label} aria-expanded={open} aria-controls="tag-input-listbox" role="combobox" />
    </div>
    {open && popoverStyle ? createPortal(<div ref={popoverRef} className="tag-input-popover" id="tag-input-listbox" role="listbox" style={popoverStyle} onMouseLeave={() => setHoveredIndex(-1)}>
      {query.trim() ? <>
        {matches.map((tag, index) => <button key={tag.id} type="button" role="option" aria-selected={activeIndex === index} className={activeIndex === index ? "is-active" : hoveredIndex === index ? "is-hovered" : undefined} onMouseEnter={() => setHoveredIndex(index)} onMouseDown={(event) => event.preventDefault()} onClick={() => add(tag.name)}>#{tag.name}</button>)}
        {canCreate ? <button type="button" role="option" aria-selected={activeIndex === matches.length} className={`${activeIndex === matches.length ? "is-active " : hoveredIndex === matches.length ? "is-hovered " : ""}tag-create-option`} onMouseEnter={() => setHoveredIndex(matches.length)} onMouseDown={(event) => event.preventDefault()} onClick={() => add(query)}>创建“{normalize(query)}”</button> : null}
        {!matches.length && !canCreate ? <p>没有可添加的标签</p> : null}
      </> : <>
        {recent.length ? <><span>最近使用</span>{recent.map((tag, index) => <button key={`recent-${tag.id}`} type="button" role="option" aria-selected={activeIndex === index} className={activeIndex === index ? "is-active" : hoveredIndex === index ? "is-hovered" : undefined} onMouseEnter={() => setHoveredIndex(index)} onMouseDown={(event) => event.preventDefault()} onClick={() => add(tag.name)}>#{tag.name}</button>)}</> : null}
        {available.length ? <><span>所有标签</span>{available.map((tag, index) => { const optionIndex = recent.length + index; return <button key={`all-${tag.id}`} type="button" role="option" aria-selected={activeIndex === optionIndex} className={activeIndex === optionIndex ? "is-active" : hoveredIndex === optionIndex ? "is-hovered" : undefined} onMouseEnter={() => setHoveredIndex(optionIndex)} onMouseDown={(event) => event.preventDefault()} onClick={() => add(tag.name)}>#{tag.name}</button>; })}</> : <p>暂无已有标签，输入文字即可创建</p>}
      </>}
    </div>, portalHost) : null}
  </div>;
}
