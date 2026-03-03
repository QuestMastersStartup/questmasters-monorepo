import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  FormField,
  INPUT_CLASS,
  SelectField,
  DescriptionArrayField,
  CollapsibleSection,
  ReferencePicker,
} from "../form-fields";
import { nameToIndex, ABILITY_SCORES } from "../../../../lib/dnd-utils";
import type { AssetFormProps } from "./types";
import type { ClassAsset, ReferenceItem } from "@questmasters/dnd-rules";

const HIT_DICE = [
  { value: "6", label: "d6" },
  { value: "8", label: "d8" },
  { value: "10", label: "d10" },
  { value: "12", label: "d12" },
];

interface StartingEquipmentEntry {
  name: string;
  quantity: number;
}

export function ClassForm({
  onSubmit,
  packAssets,
  onCreateSubAsset,
}: AssetFormProps) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState<string[]>([]);
  const [hitDie, setHitDie] = useState("8");
  const [proficiencies, setProficiencies] = useState<ReferenceItem[]>([]);
  const [savingThrow1, setSavingThrow1] = useState("str");
  const [savingThrow2, setSavingThrow2] = useState("con");
  const [subclasses, setSubclasses] = useState<ReferenceItem[]>([]);
  const [equipment, setEquipment] = useState<StartingEquipmentEntry[]>([]);

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

    const st1 = ABILITY_SCORES.find((a) => a.index === savingThrow1);
    const st2 = ABILITY_SCORES.find((a) => a.index === savingThrow2);

    const data: ClassAsset = {
      name: name.trim(),
      index,
      desc,
      hit_die: Number(hitDie),
      proficiency_choices: [],
      proficiencies,
      saving_throws: [
        {
          index: savingThrow1,
          name: st1?.full ?? savingThrow1,
          url: `/api/ability-scores/${savingThrow1}`,
        },
        {
          index: savingThrow2,
          name: st2?.full ?? savingThrow2,
          url: `/api/ability-scores/${savingThrow2}`,
        },
      ],
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
      starting_equipment_options: [],
      subclasses,
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
          placeholder="e.g. Ranger"
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
        placeholder="Describe the class..."
      />

      {/* Core */}
      <CollapsibleSection title="Core" defaultOpen>
        <SelectField
          label="Hit Die"
          value={hitDie}
          onChange={setHitDie}
          options={HIT_DICE}
          required
        />
      </CollapsibleSection>

      {/* Saving Throws */}
      <CollapsibleSection title="Saving Throws" defaultOpen>
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Primary"
            value={savingThrow1}
            onChange={setSavingThrow1}
            options={ABILITY_SCORES.map((a) => ({
              value: a.index,
              label: a.full,
            }))}
          />
          <SelectField
            label="Secondary"
            value={savingThrow2}
            onChange={setSavingThrow2}
            options={ABILITY_SCORES.map((a) => ({
              value: a.index,
              label: a.full,
            }))}
          />
        </div>
      </CollapsibleSection>

      {/* Proficiencies */}
      <CollapsibleSection title="Proficiencies">
        <ReferencePicker
          label="Class Proficiencies"
          filterType="proficiency"
          packAssets={packAssets}
          value={proficiencies}
          onChange={setProficiencies}
          onCreateInline={handleCreateSubAsset}
          hint="Armor, weapon, and tool proficiencies"
        />
      </CollapsibleSection>

      {/* Starting Equipment */}
      <CollapsibleSection title="Starting Equipment">
        <FormField label="Equipment" hint="Items the character starts with">
          <div className="space-y-2">
            {equipment.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  className={`${INPUT_CLASS} flex-1`}
                  value={item.name}
                  onChange={(e) =>
                    updateEquipment(idx, "name", e.target.value)
                  }
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
      </CollapsibleSection>

      {/* Subclasses */}
      <CollapsibleSection title="Subclasses">
        <ReferencePicker
          label="Subclasses"
          filterType="subclass"
          packAssets={packAssets}
          value={subclasses}
          onChange={setSubclasses}
          onCreateInline={handleCreateSubAsset}
          hint="e.g. Champion, Battle Master"
        />
      </CollapsibleSection>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="btn btn-primary gap-2"
        >
          Add Class
        </button>
      </div>
    </div>
  );
}
