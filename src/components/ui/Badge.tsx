import type { HTMLAttributes } from "react";
import { cn } from "@/src/lib/cn";

export function Badge({ className, children, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("badge", className)} {...props}><span aria-hidden="true">#</span>{children}</span>;
}
