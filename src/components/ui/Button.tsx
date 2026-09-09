import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { Button as AriaButton } from "react-aria-components";
import { cn } from "@/src/lib/cn";

const buttonStyles = cva("button", {
  variants: {
    variant: {
      primary: "button-primary",
      secondary: "button-secondary",
      ghost: "button-ghost",
      danger: "button-danger",
      dangerGhost: "button-danger-ghost",
    },
    size: { sm: "button-sm", md: "button-md", icon: "button-icon" },
  },
  defaultVariants: { variant: "secondary", size: "md" },
});

type ButtonProps = ComponentProps<typeof AriaButton> & VariantProps<typeof buttonStyles>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <AriaButton className={cn(buttonStyles({ variant, size }), className)} {...props} />;
}
