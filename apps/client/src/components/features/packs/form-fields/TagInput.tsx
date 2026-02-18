import { useState } from "react";
import { X } from "lucide-react";
import { FormField, INPUT_CLASS } from "./FormField";

interface TagInputProps {
  label: string;
  id?: string;
  name?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  required?: boolean;
  hint?: string;
  error?: string;
  placeholder?: string;
  className?: string;
}

export function TagInput({
  label,
  id,
  name,
  tags,
  onChange,
  suggestions,
  required,
  hint,
  error,
  placeholder = "Type and press Enter...",
  className,
}: TagInputProps) {
  const [input, setInput] = useState("");

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput("");
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const unusedSuggestions = suggestions?.filter((s) => !tags.includes(s));

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
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium border border-primary/20"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(idx)}
                  aria-label={`Remove tag ${tag}`}
                  className="hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <input
          id={id}
          name={name || id}
          className={INPUT_CLASS}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
        {unusedSuggestions && unusedSuggestions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {unusedSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addTag(s)}
                className="text-xs px-2 py-0.5 rounded border border-border/60 bg-muted/30 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-colors"
              >
                + {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </FormField>
  );
}
