/**
 * Ability Score types for D&D 5e Point Buy system.
 *
 * These types are used by the Character Builder to validate
 * and calculate ability scores during character creation.
 */

/** The six canonical D&D 5e ability score names */
export const ABILITY_NAMES = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
] as const;

/** Union type of valid ability score names */
export type AbilityName = (typeof ABILITY_NAMES)[number];

/** Record mapping each ability name to its numeric score */
export type AbilityScores = Record<AbilityName, number>;

/** Short-form ability score abbreviations (for UI display) */
export const ABILITY_ABBREVIATIONS: Record<AbilityName, string> = {
  strength: "STR",
  dexterity: "DEX",
  constitution: "CON",
  intelligence: "INT",
  wisdom: "WIS",
  charisma: "CHA",
} as const;

/** Result of Point Buy validation */
export interface PointBuyValidation {
  /** Whether the ability scores are valid under Point Buy rules */
  valid: boolean;
  /** Total points spent */
  totalCost: number;
  /** Points remaining from the budget */
  remaining: number;
  /** Per-ability breakdown of costs */
  breakdown: Record<AbilityName, number>;
  /** List of error messages, empty if valid */
  errors: string[];
}

/** Result of Hit Points calculation */
export interface HitPointsResult {
  /** Maximum HP at the given level */
  maxHp: number;
  /** Constitution modifier used in the calculation */
  constitutionModifier: number;
  /** Hit die used (e.g., 10 for Fighter) */
  hitDie: number;
  /** Character level used */
  level: number;
}
