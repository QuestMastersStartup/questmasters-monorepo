import { useState } from "react";
import { FormField, INPUT_CLASS } from "../form-fields";
import { DescriptionArrayField } from "../form-fields";
import { nameToIndex } from "../../../../lib/dnd-utils";
import type { AssetFormProps } from "./types";

export function GenericAssetForm({ onSubmit }: AssetFormProps) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState<string[]>([]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    const index = nameToIndex(name);
    onSubmit({ name: name.trim(), index, desc });
  };

  return (
    <div className="space-y-4">
      <FormField label="Name" required>
        <input
          autoFocus
          className={INPUT_CLASS}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Asset name"
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
        placeholder="Enter a description paragraph..."
      />

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="btn btn-primary gap-2"
        >
          Add Asset
        </button>
      </div>
    </div>
  );
}
