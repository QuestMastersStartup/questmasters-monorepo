import { Plus, Trash2 } from "lucide-react";
import { FormField } from "./FormField";
import { ABILITY_SCORES } from "../../../../lib/dnd-utils";

export interface AbilityBonus {
  ability_score: string;
  bonus: number;
}

interface AbilityBonusListProps {
  label: string;
  value: AbilityBonus[];
  onChange: (bonuses: AbilityBonus[]) => void;
  hint?: string;
  className?: string;
}

export function AbilityBonusList({
  label,
  value,
  onChange,
  hint,
  className,
}: AbilityBonusListProps) {
  const addBonus = () => {
    // Find first ability not already used
    const used = new Set(value.map((b) => b.ability_score));
    const next = ABILITY_SCORES.find((a) => !used.has(a.index));
    onChange([
      ...value,
      { ability_score: next?.index ?? "str", bonus: 1 },
    ]);
  };

  const updateBonus = (idx: number, field: keyof AbilityBonus, v: string | number) => {
    const updated = [...value];
    if (field === "bonus") {
      updated[idx] = { ...updated[idx], bonus: v as number };
    } else {
      updated[idx] = { ...updated[idx], ability_score: v as string };
    }
    onChange(updated);
  };

  const removeBonus = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <FormField label={label} hint={hint} className={className}>
      <div className="space-y-2">
        {value.map((bonus, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <select
              className="flex-1 h-9 rounded-md border border-input bg-background/50 px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={bonus.ability_score}
              onChange={(e) => updateBonus(idx, "ability_score", e.target.value)}
            >
              {ABILITY_SCORES.map((a) => (
                <option key={a.index} value={a.index}>
                  {a.full} ({a.name})
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs text-muted-foreground">+</span>
              <input
                type="number"
                className="w-16 h-9 rounded-md border border-input bg-background/50 px-2 py-1 text-sm text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={bonus.bonus}
                onChange={(e) => updateBonus(idx, "bonus", Number(e.target.value))}
                min={-5}
                max={5}
              />
            </div>
            <button
              type="button"
              onClick={() => removeBonus(idx)}
              className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {value.length < 6 && (
          <button
            type="button"
            onClick={addBonus}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Plus className="w-3 h-3 inline mr-0.5" />
            Add ability bonus
          </button>
        )}
      </div>
    </FormField>
  );
}
