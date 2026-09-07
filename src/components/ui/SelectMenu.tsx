import { RiArrowDownSLine, RiCheckLine } from "@remixicon/react";
import type { ReactNode } from "react";
import { Button, ListBox, ListBoxItem, Popover, Select, SelectValue } from "react-aria-components";
import { cn } from "@/src/lib/cn";

interface SelectMenuOption<T extends string> {
  value: T;
  label: string;
}

interface SelectMenuProps<T extends string> {
  label: string;
  value: T;
  options: ReadonlyArray<SelectMenuOption<T>>;
  onChange: (value: T) => void;
  icon?: ReactNode;
  className?: string;
}

export function SelectMenu<T extends string>({ label, value, options, onChange, icon, className }: SelectMenuProps<T>) {
  return (
    <Select className={cn("select-menu", className)} aria-label={label} selectedKey={value} onSelectionChange={(key) => key !== null && onChange(String(key) as T)}>
      <Button className="toolbar-trigger select-menu-trigger" aria-label={label}>
        {icon}
        <SelectValue>{({ selectedText }) => selectedText}</SelectValue>
        <RiArrowDownSLine className="select-menu-chevron" size={15} aria-hidden="true" />
      </Button>
      <Popover className="popover-surface select-menu-popover" placement="bottom end" offset={6}>
        <ListBox className="select-menu-list" items={options}>
          {(option) => (
            <ListBoxItem id={option.value} className="select-menu-option" textValue={option.label}>
              <span>{option.label}</span>
              <RiCheckLine size={15} aria-hidden="true" />
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </Select>
  );
}
