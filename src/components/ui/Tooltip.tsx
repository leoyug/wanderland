import type { ComponentProps, ReactNode } from "react";
import { Tooltip as AriaTooltip, TooltipTrigger } from "react-aria-components";
import { cn } from "@/src/lib/cn";

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  className?: string;
  placement?: ComponentProps<typeof AriaTooltip>["placement"];
  offset?: number;
}

export function Tooltip({ children, content, className, placement = "top", offset = 8 }: TooltipProps) {
  return (
    <TooltipTrigger delay={400} closeDelay={80}>
      {children}
      <AriaTooltip className={cn("tooltip-bubble", className)} placement={placement} offset={offset}>
        {content}
      </AriaTooltip>
    </TooltipTrigger>
  );
}
