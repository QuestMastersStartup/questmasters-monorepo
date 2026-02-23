import { useState } from "react";
import {
  FormField,
  INPUT_CLASS,
  SelectField,
  DescriptionArrayField,
  CollapsibleSection,
  ReferencePicker,
} from "../form-fields";
import { DiceField } from "../form-fields/DiceField";
import { nameToIndex, MAGIC_SCHOOLS, DAMAGE_TYPES } from "../../../../lib/dnd-utils";
import type { AssetFormProps } from "./types";
import type { SpellAsset, ReferenceItem } from "@questmasters/dnd-rules";

const SPELL_LEVELS = Array.from({ length: 10 }, (_, i) => ({
  value: String(i),
  label: i === 0 ? "Cantrip" : `Level ${i}`,
}));

export function SpellForm({
  onSubmit,
  packAssets,
  onCreateSubAsset,
}: AssetFormProps) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState<string[]>([]);
  const [higherLevel, setHigherLevel] = useState<string[]>([]);
  const [level, setLevel] = useState(0);
  const [castingTime, setCastingTime] = useState("1 action");
  const [range, setRange] = useState("Self");
  const [duration, setDuration] = useState("Instantaneous");
  const [concentration, setConcentration] = useState(false);
  const [ritual, setRitual] = useState(false);

  // Components
  const [components, setComponents] = useState<string[]>([]);
  const [material, setMaterial] = useState("");

  // Damage
  const [damageType, setDamageType] = useState("");
  const [damageDice, setDamageDice] = useState("");

  // Classification
  const [school, setSchool] = useState("evocation");
  const [classes, setClasses] = useState<ReferenceItem[]>([]);

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

  const handleSubmit = () => {
    if (!name.trim()) return;
    const index = nameToIndex(name);
    const selectedSchool = MAGIC_SCHOOLS.find((s) => s.index === school);

    const data: SpellAsset = {
      name: name.trim(),
      index,
      desc,
      ...(higherLevel.length > 0 && { higher_level: higherLevel }),
      range,
      components,
      ...(material && { material }),
      ritual,
      duration,
      concentration,
      casting_time: castingTime,
      level,
      school: {
        index: school,
        name: selectedSchool?.name ?? school,
        url: `/api/magic-schools/${school}`,
      },
      classes,
      ...(damageType &&
        damageDice && {
          damage: {
            damage_type: {
              index: nameToIndex(damageType),
              name: damageType,
              url: `/api/damage-types/${nameToIndex(damageType)}`,
            },
            damage_at_slot_level: { [String(level)]: damageDice },
          },
        }),
    };
    onSubmit(data);
  };

  const hasMaterial = components.includes("M");

  return (
    <div className="space-y-4">
      <FormField label="Name" required>
        <input
          autoFocus
          className={INPUT_CLASS}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Fireball"
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
        placeholder="Describe the spell's effects..."
      />

      {/* Casting */}
      <CollapsibleSection title="Casting" defaultOpen>
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Spell Level"
            value={String(level)}
            onChange={(v) => setLevel(Number(v))}
            options={SPELL_LEVELS}
          />
          <FormField label="Casting Time">
            <input
              className={INPUT_CLASS}
              value={castingTime}
              onChange={(e) => setCastingTime(e.target.value)}
              placeholder="1 action"
            />
          </FormField>
          <FormField label="Range">
            <input
              className={INPUT_CLASS}
              value={range}
              onChange={(e) => setRange(e.target.value)}
              placeholder="Self, 120 feet, Touch..."
            />
          </FormField>
          <FormField label="Duration">
            <input
              className={INPUT_CLASS}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Instantaneous, 1 minute..."
            />
          </FormField>
        </div>
        <div className="flex gap-6 mt-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={concentration}
              onChange={(e) => setConcentration(e.target.checked)}
              className="rounded border-input"
            />
            Concentration
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={ritual}
              onChange={(e) => setRitual(e.target.checked)}
              className="rounded border-input"
            />
            Ritual
          </label>
        </div>
      </CollapsibleSection>

      {/* Components */}
      <CollapsibleSection title="Components" defaultOpen>
        <div className="flex gap-4 mb-3">
          {["V", "S", "M"].map((comp) => (
            <label
              key={comp}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                checked={components.includes(comp)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setComponents([...components, comp]);
                  } else {
                    setComponents(components.filter((c) => c !== comp));
                    if (comp === "M") setMaterial("");
                  }
                }}
                className="rounded border-input"
              />
              {comp === "V" ? "Verbal" : comp === "S" ? "Somatic" : "Material"}
            </label>
          ))}
        </div>
        {hasMaterial && (
          <FormField label="Material Component">
            <input
              className={INPUT_CLASS}
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="e.g. A tiny ball of bat guano and sulfur"
            />
          </FormField>
        )}
      </CollapsibleSection>

      {/* At Higher Levels */}
      <CollapsibleSection title="At Higher Levels">
        <DescriptionArrayField
          label="Higher Level Effects"
          value={higherLevel}
          onChange={setHigherLevel}
          placeholder="When you cast this spell using a spell slot of..."
        />
      </CollapsibleSection>

      {/* Damage */}
      <CollapsibleSection title="Damage">
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Damage Type"
            value={damageType}
            onChange={setDamageType}
            options={[
              { value: "", label: "None" },
              ...DAMAGE_TYPES.map((d) => ({ value: d, label: d })),
            ]}
          />
          <DiceField
            label="Damage Dice"
            value={damageDice}
            onChange={setDamageDice}
            placeholder="e.g. 8d6"
          />
        </div>
      </CollapsibleSection>

      {/* Classification */}
      <CollapsibleSection title="Classification" defaultOpen>
        <SelectField
          label="School of Magic"
          value={school}
          onChange={setSchool}
          options={MAGIC_SCHOOLS.map((s) => ({
            value: s.index,
            label: s.name,
          }))}
          required
        />
        <ReferencePicker
          label="Classes"
          filterType="class"
          packAssets={packAssets}
          value={classes}
          onChange={setClasses}
          onCreateInline={handleCreateSubAsset}
          hint="Which classes have access to this spell"
          className="mt-4"
        />
      </CollapsibleSection>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="btn btn-primary gap-2"
        >
          Add Spell
        </button>
      </div>
    </div>
  );
}
