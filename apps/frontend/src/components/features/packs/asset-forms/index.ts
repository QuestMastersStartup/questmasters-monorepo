import type { ComponentType } from "react";
import type { AssetFormProps } from "./types";
import { GenericAssetForm } from "./GenericAssetForm";
import { FeatForm } from "./FeatForm";
import { MagicItemForm } from "./MagicItemForm";
import { BackgroundForm } from "./BackgroundForm";
import { RaceForm } from "./RaceForm";
import { SpellForm } from "./SpellForm";
import { EquipmentForm } from "./EquipmentForm";
import { ClassForm } from "./ClassForm";
import { MonsterForm } from "./MonsterForm";

// Form registry — maps asset type to its specialized form component
const FORM_REGISTRY: Record<string, ComponentType<AssetFormProps>> = {
  feat: FeatForm,
  "magic-item": MagicItemForm,
  background: BackgroundForm,
  race: RaceForm,
  spell: SpellForm,
  equipment: EquipmentForm,
  class: ClassForm,
  monster: MonsterForm,
};

export function registerAssetForm(
  type: string,
  component: ComponentType<AssetFormProps>,
) {
  FORM_REGISTRY[type] = component;
}

export function getAssetForm(type: string): ComponentType<AssetFormProps> {
  return FORM_REGISTRY[type] ?? GenericAssetForm;
}

// Types that need the full slide-over panel (many fields, collapsible sections)
export const COMPLEX_TYPES = new Set([
  "class",
  "race",
  "spell",
  "equipment",
  "monster",
]);

// Types that get an expanded modal (fewer fields, still rich)
export const SIMPLE_RICH_TYPES = new Set([
  "magic-item",
  "feat",
  "background",
]);

export function getFormLayout(
  type: string,
): "panel" | "modal-rich" | "modal-basic" {
  if (COMPLEX_TYPES.has(type)) return "panel";
  if (SIMPLE_RICH_TYPES.has(type)) return "modal-rich";
  return "modal-basic";
}

export type { AssetFormProps } from "./types";
export { GenericAssetForm } from "./GenericAssetForm";
