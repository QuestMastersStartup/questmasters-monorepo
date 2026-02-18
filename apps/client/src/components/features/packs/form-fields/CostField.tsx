import { FormField } from "./FormField";

export interface Cost {
  quantity: number;
  unit: string;
}

const CURRENCY_UNITS = [
  { value: "cp", label: "CP" },
  { value: "sp", label: "SP" },
  { value: "ep", label: "EP" },
  { value: "gp", label: "GP" },
  { value: "pp", label: "PP" },
];

interface CostFieldProps {
  label: string;
  value: Cost;
  onChange: (cost: Cost) => void;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
}

export function CostField({
  label,
  value,
  onChange,
  required,
  hint,
  error,
  className,
}: CostFieldProps) {
  return (
    <FormField
      label={label}
      required={required}
      hint={hint}
      error={error}
      className={className}
    >
      <div className="flex gap-2">
        <input
          type="number"
          className="flex-1 h-10 rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={value.quantity}
          onChange={(e) =>
            onChange({ ...value, quantity: Number(e.target.value) })
          }
          min={0}
          placeholder="0"
        />
        <select
          className="w-20 h-10 rounded-md border border-input bg-background/50 px-2 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={value.unit}
          onChange={(e) => onChange({ ...value, unit: e.target.value })}
        >
          {CURRENCY_UNITS.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </select>
      </div>
    </FormField>
  );
}
