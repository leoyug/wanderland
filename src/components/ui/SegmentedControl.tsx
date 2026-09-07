import type { ReactNode } from "react";
import { cn } from "@/src/lib/cn";

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
    <div className={cn("segmented-control", className)} role="group" aria-label={label}>
      {options.map((option) => (
        <button type="button" key={option.value} aria-pressed={value === option.value} aria-label={option.label} disabled={option.isDisabled} title={option.disabledReason} onClick={() => onChange(option.value)}>
          {option.icon}
        </button>
      ))}
    </div>
  );
}
