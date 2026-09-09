import type { ReactNode } from "react";
import { ToggleButton, ToggleButtonGroup } from "react-aria-components";
import { cn } from "@/src/lib/cn";
import { Tooltip } from "./Tooltip";

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon: ReactNode;
  isDisabled?: boolean;
  disabledReason?: string;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  options: ReadonlyArray<SegmentedOption<T>>;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({ label, value, options, onChange, className }: SegmentedControlProps<T>) {
  return (
    <ToggleButtonGroup className={cn("segmented-control", className)} aria-label={label} selectionMode="single" selectedKeys={[value]} onSelectionChange={(keys) => { const next = [...keys][0]; if (next) onChange(String(next) as T); }}>
      {options.map((option) => (
        <Tooltip key={option.value} content={option.isDisabled && option.disabledReason ? `${option.label}：${option.disabledReason}` : option.label}>
          <ToggleButton id={option.value} aria-label={option.isDisabled && option.disabledReason ? `${option.label}：${option.disabledReason}` : option.label} isDisabled={option.isDisabled}>
            {option.icon}
          </ToggleButton>
        </Tooltip>
      ))}
    </ToggleButtonGroup>
  );
}
