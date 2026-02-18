export type UUID = string;

// Enum for all Asset Types (Canonical Source)
export enum AssetType {
  CLASS = "class",
  SUBCLASS = "subclass",
  RACE = "race",
  SUBRACE = "subrace",
  SPECIES = "species", // One D&D term
  SPELL = "spell",
  MONSTER = "monster",
  EQUIPMENT = "equipment",
  MAGIC_ITEM = "magic-item",
  FEAT = "feat",
  FEATURE = "feature",
  BACKGROUND = "background",
  TRAIT = "trait",
  CONDITION = "condition",
  DAMAGE_TYPE = "damage-type",
  ABILITY_SCORE = "ability-score",
  SKILL = "skill",
  PROFICIENCY = "proficiency",
  LANGUAGE = "language",
  ALIGNMENT = "alignment",
  MAGIC_SCHOOL = "magic-school",
  WEAPON_PROPERTY = "weapon-property",
  WEAPON_MASTERY = "weapon-mastery",
  EQUIPMENT_CATEGORY = "equipment-category",
  RULE = "rule",
  RULE_SECTION = "rule-section",
  LEVEL = "level",
}

// Complex Choice Structure
export interface Choice {
  choose: number;
  type: string; // 'proficiencies', 'equipment', 'trait', etc.
  from: OptionSet;
}

export type OptionSet =
  | OptionsArray
  | EquipmentCategoryOption
  | ReferenceOption;

export interface OptionsArray {
  option_set_type: "options_array";
  options: Option[];
}

export interface EquipmentCategoryOption {
  option_set_type: "equipment_category";
  equipment_category: ReferenceItem;
}

export interface ReferenceOption {
  option_set_type: "reference";
  reference: ReferenceItem;
}

export interface Option {
  option_type: "reference" | "choice" | "counted_reference" | "string";
  item?: ReferenceItem;
  choice?: Choice;
  count?: number;
  of?: ReferenceItem;
  string?: string;
}

export interface ReferenceItem {
  index: string;
  name: string;
  url: string;
}

// Canonical Asset Types
export interface BaseAsset {
  index: string;
  name: string;
  url?: string;
  desc?: string[];
}

export interface ClassAsset extends BaseAsset {
  hit_die: number;
  proficiency_choices: Choice[];
  proficiencies: ReferenceItem[];
  saving_throws: ReferenceItem[];
  starting_equipment: any[]; // TODO: Define strict equipment structure
  starting_equipment_options: Choice[];
  subclasses: ReferenceItem[];
}

export interface RaceAsset extends BaseAsset {
  speed: number;
  ability_bonuses: any[];
  alignment: string;
  age: string;
  size: string;
  size_description: string;
  starting_proficiencies: ReferenceItem[];
  languages: ReferenceItem[];
  language_desc: string;
  traits: ReferenceItem[];
  subraces: ReferenceItem[];
}

export interface LevelAsset extends BaseAsset {
  level: number;
  ability_score_bonuses: number;
  prof_bonus: number;
  features: ReferenceItem[];
  class_specific: Record<string, any>;
  class: ReferenceItem;
}

export interface SpellAsset extends BaseAsset {
  higher_level?: string[];
  range: string;
  components: string[];
  material?: string;
  ritual: boolean;
  duration: string;
  concentration: boolean;
  casting_time: string;
  level: number;
  attack_type?: string;
  damage?: {
    damage_type: ReferenceItem;
    damage_at_slot_level?: Record<string, string>;
    damage_at_character_level?: Record<string, string>;
  };
  dc?: {
    dc_type: ReferenceItem;
    dc_success: string;
  };
  school: ReferenceItem;
  classes: ReferenceItem[];
  subclasses?: ReferenceItem[];
}

export interface EquipmentAsset extends BaseAsset {
  equipment_category: ReferenceItem;
  weapon_category?: string;
  weapon_range?: string;
  category_range?: string;
  armor_category?: string;
  armor_class?: { base: number; dex_bonus: boolean; max_bonus?: number };
  str_minimum?: number;
  stealth_disadvantage?: boolean;
  cost: { quantity: number; unit: string };
  damage?: { damage_dice: string; damage_type: ReferenceItem };
  two_handed_damage?: { damage_dice: string; damage_type: ReferenceItem };
  range?: { normal: number; long?: number };
  throw_range?: { normal: number; long: number };
  weight?: number;
  properties?: ReferenceItem[];
  gear_category?: ReferenceItem;
}

export interface MagicItemAsset extends BaseAsset {
  rarity: { name: string };
  equipment_category: ReferenceItem;
  variants?: ReferenceItem[];
  variant?: boolean;
}

export interface MonsterAsset extends BaseAsset {
  size: string;
  type: string;
  alignment: string;
  armor_class: { type: string; value: number }[];
  hit_points: number;
  hit_dice: string;
  hit_points_roll: string;
  speed: Record<string, string>;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  proficiencies?: { value: number; proficiency: ReferenceItem }[];
  damage_vulnerabilities?: string[];
  damage_resistances?: string[];
  damage_immunities?: string[];
  condition_immunities?: ReferenceItem[];
  senses: Record<string, string | number>;
  languages: string;
  challenge_rating: number;
  proficiency_bonus?: number;
  xp: number;
  special_abilities?: { name: string; desc: string }[];
  actions?: { name: string; desc: string; attack_bonus?: number; damage?: { damage_dice: string; damage_type: ReferenceItem }[] }[];
  legendary_actions?: { name: string; desc: string }[];
  reactions?: { name: string; desc: string }[];
}

export interface FeatAsset extends BaseAsset {
  prerequisites: { ability_score?: ReferenceItem; minimum_score?: number }[];
}

export interface BackgroundAsset extends BaseAsset {
  starting_proficiencies: ReferenceItem[];
  language_options?: Choice;
  starting_equipment: { equipment: ReferenceItem; quantity: number }[];
  starting_equipment_options?: Choice[];
  feature?: { name: string; desc: string[] };
}

export type AssetData =
  | ClassAsset
  | RaceAsset
  | SpellAsset
  | EquipmentAsset
  | MagicItemAsset
  | MonsterAsset
  | FeatAsset
  | BackgroundAsset
  | LevelAsset
  | BaseAsset;
