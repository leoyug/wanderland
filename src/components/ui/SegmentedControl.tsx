import type { ReactNode } from "react";
import { useLayoutEffect, useRef, useCallback } from "react";
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
  const groupRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const buttonRefs = useRef(new Map<T, HTMLButtonElement>());
  const hasPositioned = useRef(false);
  const movePill = useCallback((animate: boolean) => {
    const group = groupRef.current;
    const pill = pillRef.current;
    const button = buttonRefs.current.get(value);
    if (!group || !pill || !button) return;
    const groupRect = group.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    const left = buttonRect.left - groupRect.left;
    if (!animate) {
      const previousTransition = pill.style.transition;
      pill.style.transition = "none";
      pill.style.transform = `translateX(${left}px)`;
      pill.style.width = `${buttonRect.width}px`;
      void pill.offsetWidth;
      pill.style.transition = previousTransition;
      return;
    }
    pill.style.transform = `translateX(${left}px)`;
    pill.style.width = `${buttonRect.width}px`;
  }, [value]);

  useLayoutEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    const animate = hasPositioned.current;
    let frame: number | undefined;
    if (animate) {
      frame = window.requestAnimationFrame(() => {
        frame = window.requestAnimationFrame(() => movePill(true));
      });
    } else {
      movePill(false);
    }
    hasPositioned.current = true;
    const handleResize = () => movePill(false);
    window.addEventListener("resize", handleResize);
    return () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
    };
  }, [movePill]);

  return (
    <ToggleButtonGroup ref={groupRef} className={cn("segmented-control", "t-tabs", className)} aria-label={label} selectionMode="single" selectedKeys={[value]} onSelectionChange={(keys) => { const next = [...keys][0]; if (next) onChange(String(next) as T); }}>
      <span ref={pillRef} className="t-tabs-pill" aria-hidden="true" />
      {options.map((option) => (
        <Tooltip key={option.value} content={option.isDisabled && option.disabledReason ? `${option.label}：${option.disabledReason}` : option.label}>
          <ToggleButton className="t-tab" ref={(node) => { if (node) buttonRefs.current.set(option.value, node); else buttonRefs.current.delete(option.value); }} id={option.value} aria-label={option.isDisabled && option.disabledReason ? `${option.label}：${option.disabledReason}` : option.label} isDisabled={option.isDisabled}>
            {option.icon}
          </ToggleButton>
        </Tooltip>
      ))}
    </ToggleButtonGroup>
  );
}
