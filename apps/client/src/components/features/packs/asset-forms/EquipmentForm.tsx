import { useState } from "react";
import {
  FormField,
  INPUT_CLASS,
  NumberField,
  SelectField,
  DescriptionArrayField,
  CollapsibleSection,
  ReferencePicker,
} from "../form-fields";
import { DiceField } from "../form-fields/DiceField";
import { CostField, type Cost } from "../form-fields/CostField";
import { nameToIndex, EQUIPMENT_CATEGORIES, DAMAGE_TYPES } from "../../../../lib/dnd-utils";
import type { AssetFormProps } from "./types";
import type { EquipmentAsset, ReferenceItem } from "@questmasters/dnd-rules";

const WEAPON_CATEGORIES = [
  { value: "", label: "Not a weapon" },
  { value: "Simple", label: "Simple" },
  { value: "Martial", label: "Martial" },
];

const WEAPON_RANGES = [
  { value: "", label: "N/A" },
  { value: "Melee", label: "Melee" },
  { value: "Ranged", label: "Ranged" },
];

export function EquipmentForm({
  onSubmit,
  packAssets,
  onCreateSubAsset,
}: AssetFormProps) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState<string[]>([]);
  const [equipCategory, setEquipCategory] = useState("weapon");
  const [weaponCategory, setWeaponCategory] = useState("");
  const [weaponRange, setWeaponRange] = useState("");
  const [cost, setCost] = useState<Cost>({ quantity: 0, unit: "gp" });
  const [weight, setWeight] = useState(0);
  const [damageDice, setDamageDice] = useState("");
  const [damageType, setDamageType] = useState("");
  const [rangeNormal, setRangeNormal] = useState(0);
  const [rangeLong, setRangeLong] = useState(0);
  const [properties, setProperties] = useState<ReferenceItem[]>([]);

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

  const isWeapon = weaponCategory !== "";

  const handleSubmit = () => {
    if (!name.trim()) return;
    const index = nameToIndex(name);
    const cat = EQUIPMENT_CATEGORIES.find((c) => c.index === equipCategory);

    const data: EquipmentAsset = {
      name: name.trim(),
      index,
      desc,
      equipment_category: {
        index: equipCategory,
        name: cat?.name ?? equipCategory,
        url: `/api/equipment-categories/${equipCategory}`,
      },
      cost,
      ...(weight > 0 && { weight }),
      ...(weaponCategory && { weapon_category: weaponCategory }),
      ...(weaponRange && { weapon_range: weaponRange }),
      ...(weaponCategory &&
        weaponRange && {
          category_range: `${weaponCategory} ${weaponRange}`,
        }),
      ...(damageDice &&
        damageType && {
          damage: {
            damage_dice: damageDice,
            damage_type: {
              index: nameToIndex(damageType),
              name: damageType,
              url: `/api/damage-types/${nameToIndex(damageType)}`,
            },
          },
        }),
      ...(rangeNormal > 0 && {
          range: {
            normal: rangeNormal,
            ...(rangeLong > 0 && { long: rangeLong }),
          },
        }),
      ...(properties.length > 0 && { properties }),
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
          placeholder="e.g. Longsword"
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
        placeholder="Describe the equipment..."
      />

      {/* Category */}
      <CollapsibleSection title="Category" defaultOpen>
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
        <div className="grid grid-cols-2 gap-4 mt-4">
          <SelectField
            label="Weapon Category"
            value={weaponCategory}
            onChange={setWeaponCategory}
            options={WEAPON_CATEGORIES}
          />
          <SelectField
            label="Weapon Range"
            value={weaponRange}
            onChange={setWeaponRange}
            options={WEAPON_RANGES}
          />
        </div>
      </CollapsibleSection>

      {/* Economics */}
      <CollapsibleSection title="Economics" defaultOpen>
        <div className="grid grid-cols-2 gap-4">
          <CostField label="Cost" value={cost} onChange={setCost} />
          <NumberField
            label="Weight (lb)"
            value={weight || ""}
            onChange={setWeight}
            min={0}
            step={0.01}
          />
        </div>
      </CollapsibleSection>

      {/* Combat */}
      {isWeapon && (
        <CollapsibleSection title="Combat" defaultOpen>
          <div className="grid grid-cols-2 gap-4">
            <DiceField
              label="Damage Dice"
              value={damageDice}
              onChange={setDamageDice}
              placeholder="e.g. 1d8"
            />
            <SelectField
              label="Damage Type"
              value={damageType}
              onChange={setDamageType}
              options={[
                { value: "", label: "None" },
                ...DAMAGE_TYPES.map((d) => ({ value: d, label: d })),
              ]}
            />
          </div>
          {weaponRange === "Ranged" && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <NumberField
                label="Normal Range (ft)"
                value={rangeNormal || ""}
                onChange={setRangeNormal}
                min={0}
              />
              <NumberField
                label="Long Range (ft)"
                value={rangeLong || ""}
                onChange={setRangeLong}
                min={0}
              />
            </div>
          )}
        </CollapsibleSection>
      )}

      {/* Properties */}
      <CollapsibleSection title="Properties">
        <ReferencePicker
          label="Weapon Properties"
          filterType="weapon-property"
          packAssets={packAssets}
          value={properties}
          onChange={setProperties}
          onCreateInline={handleCreateSubAsset}
          hint="e.g. Finesse, Versatile, Heavy"
        />
      </CollapsibleSection>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="btn btn-primary gap-2"
        >
          Add Equipment
        </button>
      </div>
    </div>
  );
}
