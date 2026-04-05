/**
 * D&D 5e Point Buy Calculator — Pure Functions
 *
 * Implements the standard Point Buy system from the Player's Handbook:
 * - Budget: 27 points
 * - Score range: 8–15 (before racial modifiers)
 * - Cost table: 8→0, 9→1, 10→2, 11→3, 12→4, 13→5, 14→7, 15→9
 *
 * All functions are pure and side-effect free, suitable for
 * isomorphic use in both frontend and backend.
 */

import {
  ABILITY_NAMES,
  type AbilityName,
  type AbilityScores,
  type PointBuyValidation,
  type HitPointsResult,
} from "../types/ability-scores.types";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Total points available in Point Buy */
export const POINT_BUY_BUDGET = 27;

/** Minimum ability score allowed in Point Buy (before racial modifiers) */
export const POINT_BUY_MIN_SCORE = 8;

/** Maximum ability score allowed in Point Buy (before racial modifiers) */
export const POINT_BUY_MAX_SCORE = 15;

/** Absolute minimum ability score (natural floor, can't go below 1) */
export const ABILITY_SCORE_MIN = 1;

/** Absolute maximum ability score (D&D 5e hard cap) */
export const ABILITY_SCORE_MAX = 20;

/**
 * Cost table for Point Buy.
 * Maps each score value (8–15) to its point cost.
 *
 * From the Player's Handbook (PHB p.13):
 * Score | Cost
 * ------|-----
 *   8   |  0
 *   9   |  1
 *  10   |  2
 *  11   |  3
 *  12   |  4
 *  13   |  5
 *  14   |  7
 *  15   |  9
 */
export const POINT_BUY_COSTS: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
} as const;

/**
 * Proficiency bonus progression by character level.
 * PHB p.15: levels 1–4 → +2, 5–8 → +3, 9–12 → +4, 13–16 → +5, 17–20 → +6
 */
export const PROFICIENCY_BONUS_TABLE: Record<number, number> = {
  1: 2,
  2: 2,
  3: 2,
  4: 2,
  5: 3,
  6: 3,
  7: 3,
  8: 3,
  9: 4,
  10: 4,
  11: 4,
  12: 4,
  13: 5,
  14: 5,
  15: 5,
  16: 5,
  17: 6,
  18: 6,
  19: 6,
  20: 6,
} as const;

/** Default ability scores for a new Point Buy character (all 8s) */
export const DEFAULT_ABILITY_SCORES: AbilityScores = {
  strength: 8,
  dexterity: 8,
  constitution: 8,
  intelligence: 8,
  wisdom: 8,
  charisma: 8,
} as const;

// ─── Pure Functions ───────────────────────────────────────────────────────────

/**
 * Calculate the Point Buy cost for a single ability score value.
 *
 * @param score - The ability score value (8–15)
 * @returns The point cost, or -1 if the score is out of range
 *
 * @example
 * calculatePointBuyCost(10) // → 2
 * calculatePointBuyCost(15) // → 9
 * calculatePointBuyCost(16) // → -1 (out of range)
 */
export function calculatePointBuyCost(score: number): number {
  const cost = POINT_BUY_COSTS[score];
  return cost !== undefined ? cost : -1;
}

/**
 * Validate a complete set of ability scores against Point Buy rules.
 *
 * Checks:
 * 1. All six abilities are present
 * 2. Each score is within 8–15 range
 * 3. Total cost does not exceed the 27-point budget
 *
 * @param scores - The ability scores to validate
 * @returns Detailed validation result with breakdown and errors
 *
 * @example
 * validatePointBuy({ strength: 15, dexterity: 14, constitution: 13, intelligence: 12, wisdom: 10, charisma: 8 })
 * // → { valid: true, totalCost: 27, remaining: 0, ... }
 */
export function validatePointBuy(scores: AbilityScores): PointBuyValidation {
  const errors: string[] = [];
  const breakdown = {} as Record<AbilityName, number>;
  let totalCost = 0;

  // Validate each ability
  for (const ability of ABILITY_NAMES) {
    const score = scores[ability];

    // Check presence
    if (score === undefined || score === null) {
      errors.push(`Missing ability score: ${ability}`);
      breakdown[ability] = 0;
      continue;
    }

    // Check integer
    if (!Number.isInteger(score)) {
      errors.push(`${ability} must be a whole number, got ${score}`);
      breakdown[ability] = 0;
      continue;
    }

    // Check range
    if (score < POINT_BUY_MIN_SCORE) {
      errors.push(
        `${ability} score ${score} is below the minimum of ${POINT_BUY_MIN_SCORE}`
      );
      breakdown[ability] = 0;
      continue;
    }

    if (score > POINT_BUY_MAX_SCORE) {
      errors.push(
        `${ability} score ${score} exceeds the maximum of ${POINT_BUY_MAX_SCORE}`
      );
      breakdown[ability] = 0;
      continue;
    }

    // Calculate cost
    const cost = calculatePointBuyCost(score);
    breakdown[ability] = cost;
    totalCost += cost;
  }

  // Check budget
  const remaining = POINT_BUY_BUDGET - totalCost;
  if (totalCost > POINT_BUY_BUDGET) {
    errors.push(
      `Total cost ${totalCost} exceeds the budget of ${POINT_BUY_BUDGET} points (over by ${Math.abs(remaining)})`
    );
  }

  return {
    valid: errors.length === 0,
    totalCost,
    remaining,
    breakdown,
    errors,
  };
}

/**
 * Calculate the ability score modifier.
 *
 * Formula (PHB p.13): modifier = floor((score - 10) / 2)
 *
 * @param score - The ability score (typically 1–30)
 * @returns The modifier (e.g., 10 → 0, 14 → +2, 8 → -1)
 *
 * @example
 * calculateModifier(10) // → 0
 * calculateModifier(14) // → 2
 * calculateModifier(8)  // → -1
 * calculateModifier(20) // → 5
 */
export function calculateModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Calculate maximum Hit Points for a character.
 *
 * Formula (PHB p.12):
 * - Level 1: hitDie + CON modifier
 * - Levels 2+: hitDie + (level - 1) × (hitDie_avg + CON modifier)
 *
 * Uses the "fixed value" method (average hit die roll rounded up)
 * which is the standard for most organized play and digital tools.
 *
 * @param hitDie - The class's hit die (e.g., 10 for Fighter, 6 for Wizard)
 * @param constitutionScore - The character's Constitution score
 * @param level - The character's level (1–20)
 * @returns Hit Points result with breakdown
 *
 * @example
 * // Level 1 Fighter (d10), CON 14 (+2)
 * calculateHitPoints(10, 14, 1) // → { maxHp: 12, ... }
 *
 * // Level 5 Wizard (d6), CON 12 (+1)
 * calculateHitPoints(6, 12, 5) // → { maxHp: 27, ... }
 */
export function calculateHitPoints(
  hitDie: number,
  constitutionScore: number,
  level: number
): HitPointsResult {
  const conMod = calculateModifier(constitutionScore);

  // Average hit die roll (rounded up): d6→4, d8→5, d10→6, d12→7
  const hitDieAvg = Math.ceil(hitDie / 2) + 1;

  // Level 1: max hit die + CON mod
  // Levels 2+: add (average + CON mod) per level
  // Minimum 1 HP per level (PHB rule: can't gain less than 1)
  const level1Hp = hitDie + conMod;
  const subsequentHpPerLevel = Math.max(1, hitDieAvg + conMod);
  const maxHp = Math.max(1, level1Hp + (level - 1) * subsequentHpPerLevel);

  return {
    maxHp,
    constitutionModifier: conMod,
    hitDie,
    level,
  };
}

/**
 * Calculate the proficiency bonus for a given character level.
 *
 * PHB p.15: Proficiency bonus increases at levels 5, 9, 13, 17.
 * Formula: floor((level - 1) / 4) + 2
 *
 * @param level - The character's level (1–20)
 * @returns The proficiency bonus (+2 to +6)
 *
 * @example
 * calculateProficiencyBonus(1)  // → 2
 * calculateProficiencyBonus(5)  // → 3
 * calculateProficiencyBonus(20) // → 6
 */
export function calculateProficiencyBonus(level: number): number {
  // Use the lookup table for levels 1–20
  if (level >= 1 && level <= 20) {
    return PROFICIENCY_BONUS_TABLE[level]!;
  }

  // For levels outside 1–20 (edge cases), use the formula
  return Math.floor((level - 1) / 4) + 2;
}
