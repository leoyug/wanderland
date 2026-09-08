import { RiCloseLine } from "@remixicon/react";
import type { HTMLAttributes, MouseEventHandler, ReactNode } from "react";
import { cn } from "@/src/lib/cn";

interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children" | "onClick"> {
  children: ReactNode;
  variant?: "accent" | "neutral" | "selected";
  size?: "md" | "sm";
  onPress?: MouseEventHandler<HTMLButtonElement>;
  removable?: boolean;
}

export function Badge({ className, children, variant = "accent", size = "md", onPress, removable = false, ...props }: BadgeProps) {
  const content = <><span aria-hidden="true">#</span>{children}{removable ? <RiCloseLine size={13} aria-hidden="true" /> : null}</>;
  if (onPress) return <button type="button" className={cn("badge", `badge-${variant}`, `badge-${size}`, className)} onClick={onPress} {...props}>{content}</button>;
  return <span className={cn("badge", `badge-${variant}`, `badge-${size}`, className)} {...props}>{content}</span>;
}
