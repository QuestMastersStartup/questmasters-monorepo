import { useState } from "react";
import {
  FormField,
  INPUT_CLASS,
  NumberField,
  SelectField,
  DescriptionArrayField,
  CollapsibleSection,
  ReferencePicker,
  AbilityBonusList,
} from "../form-fields";
import type { AbilityBonus } from "../form-fields";
import { nameToIndex, SIZES, ABILITY_SCORES } from "../../../../lib/dnd-utils";
import type { AssetFormProps } from "./types";
import type { RaceAsset, ReferenceItem } from "@questmasters/dnd-rules";

export function RaceForm({
  onSubmit,
  packAssets,
  onCreateSubAsset,
}: AssetFormProps) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState<string[]>([]);
  const [speed, setSpeed] = useState(30);
  const [size, setSize] = useState("Medium");
  const [alignment, setAlignment] = useState("");
  const [age, setAge] = useState("");
  const [sizeDescription, setSizeDescription] = useState("");
  const [abilityBonuses, setAbilityBonuses] = useState<AbilityBonus[]>([]);
  const [languages, setLanguages] = useState<ReferenceItem[]>([]);
  const [languageDesc, setLanguageDesc] = useState("");
  const [traits, setTraits] = useState<ReferenceItem[]>([]);
  const [subraces, setSubraces] = useState<ReferenceItem[]>([]);
  const [proficiencies, setProficiencies] = useState<ReferenceItem[]>([]);

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
    const data: RaceAsset = {
      name: name.trim(),
      index,
      desc,
      speed,
      size,
      alignment,
      age,
      size_description: sizeDescription,
      ability_bonuses: abilityBonuses.map((b) => {
        const ab = ABILITY_SCORES.find((a) => a.index === b.ability_score);
        return {
          ability_score: {
            index: b.ability_score,
            name: ab?.full ?? b.ability_score,
            url: `/api/ability-scores/${b.ability_score}`,
          },
          bonus: b.bonus,
        };
      }),
      languages,
      language_desc: languageDesc,
      traits,
      subraces,
      starting_proficiencies: proficiencies,
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
          placeholder="e.g. Dragonborn"
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
        placeholder="Describe the race..."
      />

      {/* Core Stats */}
      <CollapsibleSection title="Core Stats" defaultOpen>
        <div className="grid grid-cols-2 gap-4">
          <NumberField
            label="Speed"
            value={speed}
            onChange={setSpeed}
            min={0}
            max={120}
            hint="Base walking speed in feet"
          />
          <SelectField
            label="Size"
            value={size}
            onChange={setSize}
            options={SIZES.map((s) => ({ value: s, label: s }))}
          />
        </div>
        <FormField label="Alignment" className="mt-4">
          <input
            className={INPUT_CLASS}
            value={alignment}
            onChange={(e) => setAlignment(e.target.value)}
            placeholder="e.g. Tend toward good"
          />
        </FormField>
        <FormField label="Age" className="mt-4">
          <input
            className={INPUT_CLASS}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="e.g. Mature at 15, live to 80"
          />
        </FormField>
        <FormField label="Size Description" className="mt-4">
          <input
            className={INPUT_CLASS}
            value={sizeDescription}
            onChange={(e) => setSizeDescription(e.target.value)}
            placeholder="e.g. 5 to 6 feet tall, Medium size"
          />
        </FormField>
      </CollapsibleSection>

      {/* Ability Bonuses */}
      <CollapsibleSection title="Ability Bonuses" defaultOpen>
        <AbilityBonusList
          label=""
          value={abilityBonuses}
          onChange={setAbilityBonuses}
          hint="Ability score increases for this race"
        />
      </CollapsibleSection>

      {/* Languages */}
      <CollapsibleSection title="Languages">
        <ReferencePicker
          label="Languages"
          filterType="language"
          packAssets={packAssets}
          value={languages}
          onChange={setLanguages}
          onCreateInline={handleCreateSubAsset}
        />
        <FormField label="Language Description" className="mt-3">
          <input
            className={INPUT_CLASS}
            value={languageDesc}
            onChange={(e) => setLanguageDesc(e.target.value)}
            placeholder="e.g. You can speak, read, and write Common and Draconic."
          />
        </FormField>
      </CollapsibleSection>

      {/* Traits */}
      <CollapsibleSection title="Racial Traits">
        <ReferencePicker
          label="Traits"
          filterType="trait"
          packAssets={packAssets}
          value={traits}
          onChange={setTraits}
          onCreateInline={handleCreateSubAsset}
          hint="Racial features like Darkvision, Breath Weapon, etc."
        />
      </CollapsibleSection>

      {/* Proficiencies */}
      <CollapsibleSection title="Starting Proficiencies">
        <ReferencePicker
          label="Proficiencies"
          filterType="proficiency"
          packAssets={packAssets}
          value={proficiencies}
          onChange={setProficiencies}
          onCreateInline={handleCreateSubAsset}
        />
      </CollapsibleSection>

      {/* Subraces */}
      <CollapsibleSection title="Subraces">
        <ReferencePicker
          label="Subraces"
          filterType="subrace"
          packAssets={packAssets}
          value={subraces}
          onChange={setSubraces}
          onCreateInline={handleCreateSubAsset}
          hint="Subraces of this race (e.g. Hill Dwarf, Mountain Dwarf)"
        />
      </CollapsibleSection>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="btn btn-primary gap-2"
        >
          Add Race
        </button>
      </div>
    </div>
  );
}
