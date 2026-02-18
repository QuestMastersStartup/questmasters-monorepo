import { AssetType } from "./core.types";

export type PrerequisiteType =
  | "ability_score"
  | "proficiency"
  | "level"
  | "race"
  | "class"
  | "feat"
  | "custom";

export interface Prerequisite {
  type: PrerequisiteType;
  // Optional description for UI (e.g. "Must be a Dwarf")
  description?: string;
  // For Ability Score
  ability?: string;
  min_score?: number;
  // For Proficiency / Feat / Race / Class
  target?: string;
  // For Level
  min_level?: number;
  // For Custom
  key?: string;
  value?: any;
}

export interface ValidationContext {
  character: CharacterState;
  strict: boolean; // "Mode Libre": If false, ignore mechanical failures
}

// Minimal Interface for validation (expand as needed)
export interface CharacterState {
  stats: Record<string, number>;
  level: number;
  race: string;
  classes: string[];
  proficiencies: string[];
  feats: string[];
}

export interface ValidationResult {
  success: boolean;
  ignored: boolean; // True if it failed but was ignored due to strict=false
  errors: string[];
}
