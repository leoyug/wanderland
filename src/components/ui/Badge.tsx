import type { HTMLAttributes } from "react";
import { cn } from "@/src/lib/cn";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "accent" | "neutral";
}

export function Badge({ className, children, variant = "accent", ...props }: BadgeProps) {
  return <span className={cn("badge", `badge-${variant}`, className)} {...props}><span aria-hidden="true">#</span>{children}</span>;
}
