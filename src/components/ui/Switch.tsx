import {
  SwitchButton,
  SwitchField as SwitchFieldPrimitive,
  type SwitchFieldProps,
} from "react-aria-components/Switch";
import { cn } from "@/src/lib/cn";

// Adapted from Intent UI's registry component for Wanderland's semantic tokens.
// https://intentui.com/docs/components/controls/switch
export function SwitchField({ className, ...props }: SwitchFieldProps) {
  return <SwitchFieldPrimitive data-slot="control" className={cn("switch-field", className)} {...props} />;
}

type SwitchProps = Omit<SwitchFieldProps, "children" | "className"> & {
  className?: string;
  label: string;
  description?: string;
};

export function Switch({ label, description, className, ...props }: SwitchProps) {
  return (
    <SwitchFieldPrimitive className="switch-field" {...props}>
      <SwitchButton className={cn("switch", className)}>
        <span className="switch-control" data-slot="indicator" aria-hidden="true"><span className="switch-thumb" /></span>
        <span className="switch-copy" data-slot="control-label"><strong>{label}</strong>{description ? <small slot="description">{description}</small> : null}</span>
      </SwitchButton>
    </SwitchFieldPrimitive>
  );
}
