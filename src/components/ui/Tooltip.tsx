import type { ReactNode } from "react";
import { Tooltip as AriaTooltip, TooltipTrigger } from "react-aria-components";
import { cn } from "@/src/lib/cn";

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  className?: string;
}

export function Tooltip({ children, content, className }: TooltipProps) {
  return (
    <TooltipTrigger delay={400} closeDelay={80}>
      {children}
      <AriaTooltip className={cn("tooltip-bubble", className)} placement="top" offset={8}>
        {content}
      </AriaTooltip>
    </TooltipTrigger>
  );
}
