import type { ComponentProps, ReactNode } from "react";
import {
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  MenuTrigger as AriaMenuTrigger,
  Popover,
} from "react-aria-components";
import { cn } from "@/src/lib/cn";

// Intent UI menu anatomy, adapted to Wanderland's semantic CSS and Remix icons.
// https://intentui.com/docs/components/collections/menu
export const Menu = AriaMenuTrigger;

export function MenuContent({ children, className, ...props }: Omit<ComponentProps<typeof AriaMenu>, "children"> & { children: ReactNode; className?: string }) {
  return (
    <Popover className="popover-surface menu-popover" placement="top start" offset={8}>
      <AriaMenu className={cn("menu-content", className)} {...props}>{children}</AriaMenu>
    </Popover>
  );
}

export function MenuItem({ className, ...props }: ComponentProps<typeof AriaMenuItem>) {
  return <AriaMenuItem className={cn("menu-item", className)} {...props} />;
}
