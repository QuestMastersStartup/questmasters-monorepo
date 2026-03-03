import { useState } from "react";
import {
  FormField,
  INPUT_CLASS,
  NumberField,
  SelectField,
  DescriptionArrayField,
  CollapsibleSection,
} from "../form-fields";
import { ActionEditor, type MonsterAction } from "../form-fields/ActionEditor";
import {
  nameToIndex,
  SIZES,
  CHALLENGE_RATINGS,
  crToXp,
  formatCR,
} from "../../../../lib/dnd-utils";
import type { AssetFormProps } from "./types";
import type { MonsterAsset } from "@questmasters/dnd-rules";

const ARMOR_TYPES = [
  "natural",
  "leather",
  "studded leather",
  "hide",
  "chain shirt",
  "chain mail",
  "scale mail",
  "plate",
  "shield",
  "other",
];

export function MonsterForm({ onSubmit }: AssetFormProps) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState<string[]>([]);

  // Identity
  const [size, setSize] = useState("Medium");
  const [monsterType, setMonsterType] = useState("");
  const [alignment, setAlignment] = useState("");

  // Defense
  const [armorType, setArmorType] = useState("natural");
  const [armorValue, setArmorValue] = useState(10);
  const [hitPoints, setHitPoints] = useState(0);
  const [hitDice, setHitDice] = useState("");

  // Speed
  const [walkSpeed, setWalkSpeed] = useState("30 ft.");
  const [flySpeed, setFlySpeed] = useState("");
  const [swimSpeed, setSwimSpeed] = useState("");
  const [burrowSpeed, setBurrowSpeed] = useState("");
  const [climbSpeed, setClimbSpeed] = useState("");

  // Ability Scores
  const [str, setStr] = useState(10);
  const [dex, setDex] = useState(10);
  const [con, setCon] = useState(10);
  const [int, setInt] = useState(10);
  const [wis, setWis] = useState(10);
  const [cha, setCha] = useState(10);

  // Senses & Languages
  const [sensesStr, setSensesStr] = useState("");
  const [languagesStr, setLanguagesStr] = useState("");

  // Challenge
  const [cr, setCr] = useState("1");

  // Abilities & Actions
  const [specialAbilities, setSpecialAbilities] = useState<MonsterAction[]>([]);
  const [actions, setActions] = useState<MonsterAction[]>([]);
  const [legendaryActions, setLegendaryActions] = useState<MonsterAction[]>([]);

  const xp = crToXp(Number(cr));

  const handleSubmit = () => {
    if (!name.trim()) return;
    const index = nameToIndex(name);

    const speedRecord: Record<string, string> = {};
    if (walkSpeed) speedRecord.walk = walkSpeed;
    if (flySpeed) speedRecord.fly = flySpeed;
    if (swimSpeed) speedRecord.swim = swimSpeed;
    if (burrowSpeed) speedRecord.burrow = burrowSpeed;
    if (climbSpeed) speedRecord.climb = climbSpeed;

    const sensesRecord: Record<string, string | number> = {};
    if (sensesStr) {
      sensesStr.split(",").forEach((s) => {
        const trimmed = s.trim();
        if (trimmed) sensesRecord[trimmed] = trimmed;
      });
    }

    const data: MonsterAsset = {
      name: name.trim(),
      index,
      desc,
      size,
      type: monsterType,
      alignment,
      armor_class: [{ type: armorType, value: armorValue }],
      hit_points: hitPoints,
      hit_dice: hitDice,
      hit_points_roll: hitDice,
      speed: speedRecord,
      strength: str,
      dexterity: dex,
      constitution: con,
      intelligence: int,
      wisdom: wis,
      charisma: cha,
      senses: sensesRecord,
      languages: languagesStr,
      challenge_rating: Number(cr),
      xp,
      ...(specialAbilities.length > 0 && {
        special_abilities: specialAbilities
          .filter((a) => a.name.trim())
          .map((a) => ({ name: a.name, desc: a.desc })),
      }),
      ...(actions.length > 0 && {
        actions: actions
          .filter((a) => a.name.trim())
          .map((a) => ({
            name: a.name,
            desc: a.desc,
            ...(a.attack_bonus && { attack_bonus: a.attack_bonus }),
            ...(a.damage_dice &&
              a.damage_type && {
                damage: [
                  {
                    damage_dice: a.damage_dice,
                    damage_type: {
                      index: nameToIndex(a.damage_type),
                      name: a.damage_type,
                      url: `/api/damage-types/${nameToIndex(a.damage_type)}`,
                    },
                  },
                ],
              }),
          })),
      }),
      ...(legendaryActions.length > 0 && {
        legendary_actions: legendaryActions
          .filter((a) => a.name.trim())
          .map((a) => ({ name: a.name, desc: a.desc })),
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
          placeholder="e.g. Ancient Red Dragon"
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
        placeholder="Describe the monster..."
      />

      {/* Identity */}
      <CollapsibleSection title="Identity" defaultOpen>
        <div className="grid grid-cols-3 gap-4">
          <SelectField
            label="Size"
            value={size}
            onChange={setSize}
            options={SIZES.map((s) => ({ value: s, label: s }))}
          />
          <FormField label="Type">
            <input
              className={INPUT_CLASS}
              value={monsterType}
              onChange={(e) => setMonsterType(e.target.value)}
              placeholder="e.g. dragon"
            />
          </FormField>
          <FormField label="Alignment">
            <input
              className={INPUT_CLASS}
              value={alignment}
              onChange={(e) => setAlignment(e.target.value)}
              placeholder="e.g. chaotic evil"
            />
          </FormField>
        </div>
      </CollapsibleSection>

      {/* Defense */}
      <CollapsibleSection title="Defense" defaultOpen>
        <div className="grid grid-cols-2 gap-4">
          <NumberField
            label="Armor Class"
            value={armorValue}
            onChange={setArmorValue}
            min={1}
            max={30}
          />
          <SelectField
            label="Armor Type"
            value={armorType}
            onChange={setArmorType}
            options={ARMOR_TYPES.map((t) => ({ value: t, label: t }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <NumberField
            label="Hit Points"
            value={hitPoints || ""}
            onChange={setHitPoints}
            min={1}
          />
          <FormField label="Hit Dice">
            <input
              className={`${INPUT_CLASS} font-mono`}
              value={hitDice}
              onChange={(e) => setHitDice(e.target.value)}
              placeholder="e.g. 13d12+78"
            />
          </FormField>
        </div>
      </CollapsibleSection>

      {/* Speed */}
      <CollapsibleSection title="Speed">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Walk">
            <input
              className={INPUT_CLASS}
              value={walkSpeed}
              onChange={(e) => setWalkSpeed(e.target.value)}
              placeholder="30 ft."
            />
          </FormField>
          <FormField label="Fly">
            <input
              className={INPUT_CLASS}
              value={flySpeed}
              onChange={(e) => setFlySpeed(e.target.value)}
              placeholder="60 ft."
            />
          </FormField>
          <FormField label="Swim">
            <input
              className={INPUT_CLASS}
              value={swimSpeed}
              onChange={(e) => setSwimSpeed(e.target.value)}
              placeholder="30 ft."
            />
          </FormField>
          <FormField label="Burrow">
            <input
              className={INPUT_CLASS}
              value={burrowSpeed}
              onChange={(e) => setBurrowSpeed(e.target.value)}
              placeholder="20 ft."
            />
          </FormField>
          <FormField label="Climb">
            <input
              className={INPUT_CLASS}
              value={climbSpeed}
              onChange={(e) => setClimbSpeed(e.target.value)}
              placeholder="30 ft."
            />
          </FormField>
        </div>
      </CollapsibleSection>

      {/* Ability Scores */}
      <CollapsibleSection title="Ability Scores" defaultOpen>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "STR", value: str, set: setStr },
            { label: "DEX", value: dex, set: setDex },
            { label: "CON", value: con, set: setCon },
            { label: "INT", value: int, set: setInt },
            { label: "WIS", value: wis, set: setWis },
            { label: "CHA", value: cha, set: setCha },
          ].map(({ label, value, set }) => (
            <NumberField
              key={label}
              label={label}
              value={value}
              onChange={set}
              min={1}
              max={30}
            />
          ))}
        </div>
      </CollapsibleSection>

      {/* Senses & Languages */}
      <CollapsibleSection title="Senses & Languages">
        <FormField label="Senses" hint="Comma-separated (e.g. darkvision 120 ft., passive Perception 26)">
          <input
            className={INPUT_CLASS}
            value={sensesStr}
            onChange={(e) => setSensesStr(e.target.value)}
            placeholder="darkvision 120 ft., passive Perception 26"
          />
        </FormField>
        <FormField label="Languages" className="mt-4">
          <input
            className={INPUT_CLASS}
            value={languagesStr}
            onChange={(e) => setLanguagesStr(e.target.value)}
            placeholder="Common, Draconic"
          />
        </FormField>
      </CollapsibleSection>

      {/* Challenge */}
      <CollapsibleSection title="Challenge Rating" defaultOpen>
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="CR"
            value={cr}
            onChange={setCr}
            options={CHALLENGE_RATINGS.map((c) => ({
              value: String(c),
              label: formatCR(c),
            }))}
          />
          <FormField label="XP">
            <div className="h-10 flex items-center text-sm font-mono text-muted-foreground">
              {xp.toLocaleString()} XP
            </div>
          </FormField>
        </div>
      </CollapsibleSection>

      {/* Special Abilities */}
      <CollapsibleSection title="Special Abilities">
        <ActionEditor
          label="Special Abilities"
          value={specialAbilities}
          onChange={setSpecialAbilities}
        />
      </CollapsibleSection>

      {/* Actions */}
      <CollapsibleSection title="Actions">
        <ActionEditor
          label="Actions"
          value={actions}
          onChange={setActions}
          showAttack
        />
      </CollapsibleSection>

      {/* Legendary Actions */}
      <CollapsibleSection title="Legendary Actions">
        <ActionEditor
          label="Legendary Actions"
          value={legendaryActions}
          onChange={setLegendaryActions}
        />
      </CollapsibleSection>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="btn btn-primary gap-2"
        >
          Add Monster
        </button>
      </div>
    </div>
  );
}
