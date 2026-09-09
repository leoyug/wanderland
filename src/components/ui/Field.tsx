import type { ComponentProps } from "react";
import { Input, Label, TextArea, TextField } from "react-aria-components";
import { cn } from "@/src/lib/cn";

type FieldProps = ComponentProps<typeof TextField> & {
  label: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
};

export function Field({ label, placeholder, multiline, rows, className, ...props }: FieldProps) {
  return (
    <TextField className={cn("field", className)} {...props}>
      <Label>{label}</Label>
      {multiline ? <TextArea placeholder={placeholder} rows={rows} /> : <Input placeholder={placeholder} />}
    </TextField>
  );
}

export { Input };
