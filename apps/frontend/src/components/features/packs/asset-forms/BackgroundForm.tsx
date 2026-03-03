import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  FormField,
  INPUT_CLASS,
  NumberField,
  DescriptionArrayField,
  ReferencePicker,
} from "../form-fields";
import { nameToIndex } from "../../../../lib/dnd-utils";
import type { AssetFormProps } from "./types";
import type { BackgroundAsset, ReferenceItem } from "@questmasters/dnd-rules";

interface StartingEquipmentEntry {
  name: string;
  quantity: number;
}

export function BackgroundForm({
  onSubmit,
  packAssets,
  onCreateSubAsset,
}: AssetFormProps) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState<string[]>([]);
  const [proficiencies, setProficiencies] = useState<ReferenceItem[]>([]);
  const [languageChoose, setLanguageChoose] = useState(0);
  const [featureName, setFeatureName] = useState("");
  const [featureDesc, setFeatureDesc] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<StartingEquipmentEntry[]>([]);

  const addEquipment = () => {
    setEquipment([...equipment, { name: "", quantity: 1 }]);
  };

  const updateEquipment = (
    idx: number,
    field: keyof StartingEquipmentEntry,
    value: string | number,
  ) => {
    const updated = [...equipment];
    if (field === "quantity") {
      updated[idx] = { ...updated[idx], quantity: value as number };
    } else {
      updated[idx] = { ...updated[idx], name: value as string };
    }
    setEquipment(updated);
  };

  const removeEquipment = (idx: number) => {
    setEquipment(equipment.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    const index = nameToIndex(name);
    const data: BackgroundAsset = {
      name: name.trim(),
      index,
      desc,
      starting_proficiencies: proficiencies,
      starting_equipment: equipment
        .filter((e) => e.name.trim())
        .map((e) => {
          const eIdx = nameToIndex(e.name);
          return {
            equipment: {
              index: eIdx,
              name: e.name.trim(),
              url: `/api/equipment/${eIdx}`,
            },
            quantity: e.quantity,
          };
        }),
      ...(languageChoose > 0 && {
        language_options: {
          choose: languageChoose,
          type: "language",
          from: { option_set_type: "reference" as const, reference: { index: "languages", name: "Languages", url: "/api/languages" } },
        },
      }),
      ...(featureName.trim() && {
        feature: { name: featureName.trim(), desc: featureDesc },
      }),
    };
    onSubmit(data);
  };

  const handleCreateSubAsset = (assetName: string, type: string) => {
    onCreateSubAsset({
      type,
      name: assetName,
      data: {
        name: assetName,
        index: nameToIndex(assetName),
        desc: [],
      },
    });
  };

  return (
    <div className="space-y-4">
      <FormField label="Name" required>
        <input
          autoFocus
          className={INPUT_CLASS}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sage"
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
        placeholder="Describe the background..."
      />

      <ReferencePicker
        label="Starting Proficiencies"
        filterType="proficiency"
        packAssets={packAssets}
        value={proficiencies}
        onChange={setProficiencies}
        onCreateInline={handleCreateSubAsset}
        hint="Skill or tool proficiencies granted by this background"
      />

      <NumberField
        label="Language Choices"
        value={languageChoose || ""}
        onChange={setLanguageChoose}
        min={0}
        max={5}
        hint="How many extra languages the character can choose"
      />

      {/* Feature */}
      <div className="border border-border/60 rounded-lg p-3 space-y-3">
        <p className="text-sm font-medium">Background Feature</p>
        <FormField label="Feature Name">
          <input
            className={INPUT_CLASS}
            value={featureName}
            onChange={(e) => setFeatureName(e.target.value)}
            placeholder="e.g. Researcher"
          />
        </FormField>
        <DescriptionArrayField
          label="Feature Description"
          value={featureDesc}
          onChange={setFeatureDesc}
          placeholder="Describe the feature..."
        />
      </div>

      {/* Starting Equipment */}
      <FormField label="Starting Equipment" hint="Items the character starts with">
        <div className="space-y-2">
          {equipment.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                className={`${INPUT_CLASS} flex-1`}
                value={item.name}
                onChange={(e) => updateEquipment(idx, "name", e.target.value)}
                placeholder="Item name"
              />
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-xs text-muted-foreground">x</span>
                <input
                  type="number"
                  className={`${INPUT_CLASS} !w-16`}
                  value={item.quantity}
                  onChange={(e) =>
                    updateEquipment(idx, "quantity", Number(e.target.value))
                  }
                  min={1}
                />
              </div>
              <button
                type="button"
                onClick={() => removeEquipment(idx)}
                className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addEquipment}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Plus className="w-3 h-3 inline mr-0.5" />
            Add equipment
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
          Add Background
        </button>
      </div>
    </div>
  );
}
