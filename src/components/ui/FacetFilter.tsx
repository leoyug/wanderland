import { RiArrowDownSLine, RiCheckLine, RiCloseLine, RiSearchLine } from "@remixicon/react";
import { useMemo, useState, type ReactNode } from "react";
import { Checkbox, Dialog, DialogTrigger, Input, Popover, SearchField } from "react-aria-components";
import { cn } from "@/src/lib/cn";
import { Button } from "./Button";

export interface FacetOption {
  id: string;
  label: string;
  count: number;
}

interface FacetFilterProps {
  label: string;
  icon?: ReactNode;
  options: FacetOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export function FacetFilter({ label, icon, options, selectedValues, onChange, searchable = false, searchPlaceholder = "搜索……" }: FacetFilterProps) {
  const [query, setQuery] = useState("");
  const visibleOptions = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return normalized ? options.filter((option) => option.label.toLocaleLowerCase().includes(normalized)) : options;
  }, [options, query]);

  const toggleOption = (id: string) => {
    onChange(selectedValues.includes(id) ? selectedValues.filter((value) => value !== id) : [...selectedValues, id]);
  };

  return (
    <DialogTrigger>
      <Button variant="secondary" size="sm" className={cn("toolbar-trigger facet-filter-trigger", selectedValues.length > 0 && "is-active")}>
        {icon}
        <span>{label}</span>
        {selectedValues.length ? <span className="facet-filter-count">{selectedValues.length}</span> : null}
        <RiArrowDownSLine className="facet-filter-chevron" size={15} aria-hidden="true" />
      </Button>
      <Popover className="popover-surface facet-filter-popover" placement="bottom start" offset={8}>
        <Dialog className="facet-filter-dialog" aria-label={`筛选${label}`}>
          {searchable ? (
            <SearchField className="facet-filter-search" value={query} onChange={setQuery} aria-label={`搜索${label}`}>
              <RiSearchLine size={15} aria-hidden="true" />
              <Input placeholder={searchPlaceholder} />
              {query ? <Button variant="ghost" size="icon" aria-label={`清除${label}搜索`} onPress={() => setQuery("")}><RiCloseLine size={14} /></Button> : null}
            </SearchField>
          ) : null}
          <div className="facet-filter-options">
            {visibleOptions.map((option) => (
              <Checkbox key={option.id} className="facet-filter-option" isSelected={selectedValues.includes(option.id)} onChange={() => toggleOption(option.id)}>
                <span className="facet-checkbox" aria-hidden="true"><RiCheckLine size={12} /></span>
                <span className="facet-option-label">{option.label}</span>
                <span className="facet-option-count">{option.count}</span>
              </Checkbox>
            ))}
            {!visibleOptions.length ? <p className="facet-filter-empty">没有匹配的选项</p> : null}
          </div>
          {selectedValues.length ? <button type="button" className="facet-filter-clear" onClick={() => onChange([])}>清除此项筛选</button> : null}
        </Dialog>
      </Popover>
    </DialogTrigger>
  );
}
