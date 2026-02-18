import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  id?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}

export function FormField({
  label,
  id,
  required,
  hint,
  error,
  className = "",
  children,
}: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export const INPUT_CLASS =
  "w-full h-10 rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export const TEXTAREA_CLASS =
  "w-full min-h-[80px] rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export const SELECT_CLASS =
  "w-full h-10 rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
