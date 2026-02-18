import { FormField, SELECT_CLASS } from "./FormField";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  required?: boolean;
  hint?: string;
  error?: string;
  placeholder?: string;
  className?: string;
}

export function SelectField({
  label,
  id,
  name,
  value,
  onChange,
  options,
  required,
  hint,
  error,
  placeholder,
  className,
}: SelectFieldProps) {
  return (
    <FormField
      label={label}
      id={id}
      required={required}
      hint={hint}
      error={error}
      className={className}
    >
      <select
        id={id}
        name={name || id}
        className={SELECT_CLASS}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}
