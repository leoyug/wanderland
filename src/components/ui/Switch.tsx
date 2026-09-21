import {
  SwitchButton,
  SwitchField as SwitchFieldPrimitive,
  type SwitchFieldProps,
} from "react-aria-components/Switch";
import { useState } from "react";
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
  const [hasInteracted, setHasInteracted] = useState(false);
  const [uncontrolledSelected, setUncontrolledSelected] = useState(Boolean(props.defaultSelected));
  const selected = props.isSelected ?? uncontrolledSelected;
  const onChange = props.onChange;

  return (
    <SwitchFieldPrimitive
      className="switch-field"
      {...props}
      onChange={(nextSelected) => {
        setHasInteracted(true);
        if (props.isSelected === undefined) setUncontrolledSelected(nextSelected);
        onChange?.(nextSelected);
      }}
    >
      <SwitchButton className={cn("switch", className)}>
        <span className="switch-copy" data-slot="control-label"><strong>{label}</strong>{description ? <small slot="description">{description}</small> : null}</span>
        <span className={cn("switch-control t-toggle", hasInteracted && "is-init")} data-on={selected ? "true" : "false"} data-slot="indicator" aria-hidden="true"><span className="switch-thumb t-toggle-thumb" /></span>
      </SwitchButton>
    </SwitchFieldPrimitive>
  );
}
