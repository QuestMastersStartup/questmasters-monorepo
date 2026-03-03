import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { FormField, INPUT_CLASS, SelectField, DescriptionArrayField } from "../form-fields";
import { nameToIndex, ABILITY_SCORES } from "../../../../lib/dnd-utils";
import type { AssetFormProps } from "./types";
import type { FeatAsset } from "@questmasters/dnd-rules";

interface Prerequisite {
  ability_score: string;
  minimum_score: number;
}

export function FeatForm({ onSubmit }: AssetFormProps) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState<string[]>([]);
  const [prerequisites, setPrerequisites] = useState<Prerequisite[]>([]);

  const addPrerequisite = () => {
    setPrerequisites([
      ...prerequisites,
      { ability_score: "str", minimum_score: 13 },
    ]);
  };

  const updatePrerequisite = (
    idx: number,
    field: keyof Prerequisite,
    value: string | number,
  ) => {
    const updated = [...prerequisites];
    if (field === "minimum_score") {
      updated[idx] = { ...updated[idx], minimum_score: value as number };
    } else {
      updated[idx] = { ...updated[idx], ability_score: value as string };
    }
    setPrerequisites(updated);
  };

  const removePrerequisite = (idx: number) => {
    setPrerequisites(prerequisites.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    const index = nameToIndex(name);
    const data: FeatAsset = {
      name: name.trim(),
      index,
      desc,
      prerequisites: prerequisites.map((p) => {
        const ab = ABILITY_SCORES.find((a) => a.index === p.ability_score);
        return {
          ability_score: {
            index: p.ability_score,
            name: ab?.full ?? p.ability_score,
            url: `/api/ability-scores/${p.ability_score}`,
          },
          minimum_score: p.minimum_score,
        };
      }),
    };
    onSubmit(data);
  };

  return (
    <div className="space-y-4">
      <FormField label="Name" required>
        <input
          autoFocus
          className={INPUT_CLASS}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Great Weapon Master"
        />
        {name.trim() && (
          <p className="text-xs text-muted-foreground font-mono mt-1">
            index: {nameToIndex(name)}
          </p>
        )}
      </FormField>

      <DescriptionArrayField
        label="Description"
        value={desc}
        onChange={setDesc}
        placeholder="Describe the feat's effects..."
      />

      {/* Prerequisites */}
      <FormField label="Prerequisites" hint="Ability score requirements to take this feat">
        <div className="space-y-2">
          {prerequisites.map((prereq, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <SelectField
                label=""
                value={prereq.ability_score}
                onChange={(v) => updatePrerequisite(idx, "ability_score", v)}
                options={ABILITY_SCORES.map((a) => ({
                  value: a.index,
                  label: a.full,
                }))}
                className="flex-1"
              />
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-xs text-muted-foreground">min</span>
                <input
                  type="number"
                  className={`${INPUT_CLASS} !w-16`}
                  value={prereq.minimum_score}
                  onChange={(e) =>
                    updatePrerequisite(idx, "minimum_score", Number(e.target.value))
                  }
                  min={1}
                  max={30}
                />
              </div>
              <button
                type="button"
                onClick={() => removePrerequisite(idx)}
                className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addPrerequisite}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Plus className="w-3 h-3 inline mr-0.5" />
            Add prerequisite
          </button>
        </div>
      </FormField>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="btn btn-primary gap-2"
        >
          Add Feat
        </button>
      </div>
    </div>
  );
}
