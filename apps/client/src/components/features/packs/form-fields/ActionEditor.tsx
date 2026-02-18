import { Plus, Trash2 } from "lucide-react";
import { FormField, INPUT_CLASS, TEXTAREA_CLASS } from "./FormField";

export interface MonsterAction {
  name: string;
  desc: string;
  attack_bonus?: number;
  damage_dice?: string;
  damage_type?: string;
}

interface ActionEditorProps {
  label: string;
  value: MonsterAction[];
  onChange: (actions: MonsterAction[]) => void;
  showAttack?: boolean;
  hint?: string;
  className?: string;
}

export function ActionEditor({
  label,
  value,
  onChange,
  showAttack = false,
  hint,
  className,
}: ActionEditorProps) {
  const addAction = () => {
    onChange([...value, { name: "", desc: "" }]);
  };

  const updateAction = (
    idx: number,
    field: keyof MonsterAction,
    v: string | number,
  ) => {
    const updated = [...value];
    updated[idx] = { ...updated[idx], [field]: v };
    onChange(updated);
  };

  const removeAction = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <FormField label={label} hint={hint} className={className}>
      <div className="space-y-3">
        {value.map((action, idx) => (
          <div
            key={idx}
            className="border border-border/60 rounded-md p-3 space-y-2 bg-background/30"
          >
            <div className="flex items-start gap-2">
              <input
                className={`${INPUT_CLASS} flex-1`}
                value={action.name}
                onChange={(e) => updateAction(idx, "name", e.target.value)}
                placeholder="Action name"
              />
              <button
                type="button"
                onClick={() => removeAction(idx)}
                className="text-muted-foreground hover:text-destructive transition-colors p-2 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <textarea
              className={`${TEXTAREA_CLASS}`}
              value={action.desc}
              onChange={(e) => updateAction(idx, "desc", e.target.value)}
              placeholder="Describe the action..."
              rows={2}
              style={{ minHeight: "3rem" }}
            />
            {showAttack && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">
                    Attack Bonus
                  </label>
                  <input
                    type="number"
                    className={INPUT_CLASS}
                    value={action.attack_bonus ?? ""}
                    onChange={(e) =>
                      updateAction(
                        idx,
                        "attack_bonus",
                        e.target.value ? Number(e.target.value) : 0,
                      )
                    }
                    placeholder="+5"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">
                    Damage Dice
                  </label>
                  <input
                    className={`${INPUT_CLASS} font-mono`}
                    value={action.damage_dice ?? ""}
                    onChange={(e) =>
                      updateAction(idx, "damage_dice", e.target.value)
                    }
                    placeholder="2d6+3"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">
                    Damage Type
                  </label>
                  <input
                    className={INPUT_CLASS}
                    value={action.damage_type ?? ""}
                    onChange={(e) =>
                      updateAction(idx, "damage_type", e.target.value)
                    }
                    placeholder="Slashing"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addAction}
          className="text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <Plus className="w-3 h-3 inline mr-0.5" />
          Add {label.toLowerCase().replace(/s$/, "")}
        </button>
      </div>
    </FormField>
  );
}
