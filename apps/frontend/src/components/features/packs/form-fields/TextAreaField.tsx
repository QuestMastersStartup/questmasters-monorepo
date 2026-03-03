import { FormField, TEXTAREA_CLASS } from "./FormField";

interface TextAreaFieldProps {
  label: string;
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  hint?: string;
  error?: string;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export function TextAreaField({
  label,
  id,
  name,
  value,
  onChange,
  required,
  hint,
  error,
  placeholder,
  rows,
  className,
}: TextAreaFieldProps) {
  return (
    <FormField
      label={label}
      id={id}
      required={required}
      hint={hint}
      error={error}
      className={className}
    >
      <textarea
        id={id}
        name={name || id}
        className={TEXTAREA_CLASS}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={rows ? { minHeight: `${rows * 1.5}rem` } : undefined}
      />
    </FormField>
  );
}
