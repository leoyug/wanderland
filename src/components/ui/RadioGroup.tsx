import type { ReactNode } from "react";
import { Label, Radio, RadioGroup as AriaRadioGroup, Text } from "react-aria-components";

interface RadioOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

interface RadioGroupProps<T extends string> {
  label: string;
  value: T;
  options: ReadonlyArray<RadioOption<T>>;
  onChange: (value: T) => void;
  className?: string;
  orientation?: "vertical" | "horizontal";
  children?: ReactNode;
  renderOption?: (option: RadioOption<T>) => ReactNode;
}

// Intent UI radio-group anatomy, adapted to Wanderland's semantic CSS.
// https://intentui.com/docs/components/forms/radio-group
export function RadioGroup<T extends string>({ label, value, options, onChange, className, orientation = "vertical", renderOption }: RadioGroupProps<T>) {
  return (
    <AriaRadioGroup className={className} orientation={orientation} value={value} onChange={(next) => onChange(next as T)}>
      <Label>{label}</Label>
      {options.map((option) => (
        <Radio key={option.value} value={option.value} className={renderOption ? "radio-option radio-option-custom" : "radio-option"}>
          {renderOption ? renderOption(option) : <><span className="radio-indicator" aria-hidden="true" /><span><strong>{option.label}</strong>{option.description ? <Text slot="description">{option.description}</Text> : null}</span></>}
        </Radio>
      ))}
    </AriaRadioGroup>
  );
}
