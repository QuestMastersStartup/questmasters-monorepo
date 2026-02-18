import { FormField, INPUT_CLASS } from "./FormField";

interface NumberFieldProps {
  label: string;
  id?: string;
  name?: string;
  value: number | "";
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  hint?: string;
  error?: string;
  placeholder?: string;
  className?: string;
}

export function NumberField({
  label,
  id,
  name,
  value,
  onChange,
  min,
  max,
  step = 1,
  required,
  hint,
  error,
  placeholder,
  className,
}: NumberFieldProps) {
  return (
    <FormField
      label={label}
      id={id}
      required={required}
      hint={hint}
      error={error}
      className={className}
    >
      <input
        type="number"
        id={id}
        name={name || id}
        className={INPUT_CLASS}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
      />
    </FormField>
  );
}
