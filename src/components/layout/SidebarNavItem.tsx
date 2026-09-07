import type { ReactNode } from "react";
import { cn } from "@/src/lib/cn";

interface SidebarNavItemProps {
  className?: string;
  icon: ReactNode;
  label: string;
  count?: number;
  isActive?: boolean;
  onPress: () => void;
}

export function SidebarNavItem({ className, icon, label, count, isActive = false, onPress }: SidebarNavItemProps) {
  return (
    <button type="button" onClick={onPress} className={cn("nav-item", isActive && "is-active", className)}>
      {icon}
      <span>{label}</span>
      {typeof count === "number" ? <span className="nav-count">{count}</span> : null}
    </button>
  );
}
