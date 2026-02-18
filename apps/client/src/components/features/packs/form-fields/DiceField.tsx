import { FormField, INPUT_CLASS } from "./FormField";

interface DiceFieldProps {
  label: string;
  id?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  hint?: string;
  error?: string;
  placeholder?: string;
  className?: string;
}

export function DiceField({
  label,
  id,
  value,
  onChange,
  required,
  hint,
  error,
  placeholder = "e.g. 2d6+3",
  className,
}: DiceFieldProps) {
  const isValid = !value || /^\d+d\d+([+-]\d+)?$/.test(value);

  return (
    <FormField
      label={label}
      id={id}
      required={required}
      hint={hint}
      error={error || (!isValid ? "Use dice notation: NdN or NdN+N" : undefined)}
      className={className}
    >
      <input
        id={id}
        className={`${INPUT_CLASS} font-mono`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </FormField>
  );
}
