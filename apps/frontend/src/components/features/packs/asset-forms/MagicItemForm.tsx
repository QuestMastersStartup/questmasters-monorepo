import { useState } from "react";
import { FormField, INPUT_CLASS, SelectField, DescriptionArrayField } from "../form-fields";
import { nameToIndex, RARITIES, EQUIPMENT_CATEGORIES } from "../../../../lib/dnd-utils";
import type { AssetFormProps } from "./types";
import type { MagicItemAsset } from "@questmasters/dnd-rules";

export function MagicItemForm({ onSubmit }: AssetFormProps) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState<string[]>([]);
  const [rarity, setRarity] = useState("Common");
  const [equipCategory, setEquipCategory] = useState("wondrous-item");

  const handleSubmit = () => {
    if (!name.trim()) return;
    const index = nameToIndex(name);
    const cat = EQUIPMENT_CATEGORIES.find((c) => c.index === equipCategory);
    const data: MagicItemAsset = {
      name: name.trim(),
      index,
      desc,
      rarity: { name: rarity },
      equipment_category: {
        index: equipCategory,
        name: cat?.name ?? equipCategory,
        url: `/api/equipment-categories/${equipCategory}`,
      },
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
          placeholder="e.g. Cloak of Invisibility"
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
        placeholder="Describe the magic item's properties..."
      />

      <SelectField
        label="Rarity"
        value={rarity}
        onChange={setRarity}
        options={RARITIES.map((r) => ({ value: r, label: r }))}
        required
      />

      <SelectField
        label="Equipment Category"
        value={equipCategory}
        onChange={setEquipCategory}
        options={EQUIPMENT_CATEGORIES.map((c) => ({
          value: c.index,
          label: c.name,
        }))}
        required
      />

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="btn btn-primary gap-2"
        >
          Add Magic Item
        </button>
      </div>
    </div>
  );
}
