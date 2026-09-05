import type { ComponentProps } from "react";
import { Input, Label, TextArea, TextField } from "react-aria-components";
import { cn } from "@/src/lib/cn";

type FieldProps = ComponentProps<typeof TextField> & {
  label: string;
  placeholder?: string;
  multiline?: boolean;
};

export function Field({ label, placeholder, multiline, className, ...props }: FieldProps) {
  return (
    <TextField className={cn("field", className)} {...props}>
      <Label>{label}</Label>
      {multiline ? <TextArea placeholder={placeholder} /> : <Input placeholder={placeholder} />}
    </TextField>
  );
}
