import { Plus, Trash2 } from "lucide-react";
import { FormField, TEXTAREA_CLASS } from "./FormField";

interface DescriptionArrayFieldProps {
  label: string;
  id?: string;
  name?: string;
  value: string[];
  onChange: (value: string[]) => void;
  required?: boolean;
  hint?: string;
  error?: string;
  placeholder?: string;
  className?: string;
}

export function DescriptionArrayField({
  label,
  id,
  name,
  value,
  onChange,
  required,
  hint,
  error,
  placeholder = "Enter a paragraph...",
  className,
}: DescriptionArrayFieldProps) {
  const addParagraph = () => onChange([...value, ""]);

  const updateParagraph = (index: number, text: string) => {
    const updated = [...value];
    updated[index] = text;
    onChange(updated);
  };

  const removeParagraph = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <FormField
      label={label}
      id={id}
      required={required}
      hint={hint}
      error={error}
      className={className}
    >
      <div className="space-y-2">
        {value.length === 0 ? (
          <button
            type="button"
            onClick={addParagraph}
            className="w-full py-6 border-2 border-dashed border-border/60 rounded-lg text-muted-foreground text-sm hover:border-primary/40 hover:text-primary transition-colors"
          >
            <Plus className="w-4 h-4 inline mr-1" />
            Add paragraph
          </button>
        ) : (
          <>
            {value.map((paragraph, idx) => (
              <div key={idx} className="flex gap-2">
                <textarea
                  id={idx === 0 ? id : undefined}
                  name={idx === 0 ? name || id : undefined}
                  className={`${TEXTAREA_CLASS} flex-1`}
                  value={paragraph}
                  onChange={(e) => updateParagraph(idx, e.target.value)}
                  placeholder={placeholder}
                  rows={2}
                  style={{ minHeight: "3rem" }}
                />
                <button
                  type="button"
                  onClick={() => removeParagraph(idx)}
                  className="shrink-0 self-start mt-1 text-muted-foreground hover:text-destructive transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addParagraph}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Plus className="w-3 h-3 inline mr-0.5" />
              Add paragraph
            </button>
          </>
        )}
      </div>
    </FormField>
  );
}
