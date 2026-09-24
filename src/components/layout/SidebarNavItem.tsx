import type { ReactNode } from "react";
import { Button } from "@/src/components/ui/Button";
import { Tooltip } from "@/src/components/ui/Tooltip";
import { cn } from "@/src/lib/cn";

interface SidebarNavItemProps {
  className?: string;
  icon: ReactNode;
  label: string;
  count?: number;
  isActive?: boolean;
  onPress: () => void;
  tooltip?: ReactNode;
}

export function SidebarNavItem({ className, icon, label, count, isActive = false, onPress, tooltip }: SidebarNavItemProps) {
  const button = (
    <Button type="button" variant="ghost" onPress={onPress} className={cn("nav-item", isActive && "is-active", className)} aria-label={label}>
      {icon}
      <span>{label}</span>
      {typeof count === "number" ? <span className="nav-count">{count}</span> : null}
    </Button>
  );
  return tooltip ? <Tooltip content={tooltip} placement="right" offset={10} className="sidebar-tooltip-bubble">{button}</Tooltip> : button;
}
