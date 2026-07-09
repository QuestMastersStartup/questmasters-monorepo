import { describe, it, expect } from "vitest";
import {
  calculatePointBuyCost,
  validatePointBuy,
  calculateModifier,
  calculateHitPoints,
  calculateProficiencyBonus,
  getXpRangeForLevel,
  POINT_BUY_BUDGET,
  POINT_BUY_MIN_SCORE,
  POINT_BUY_MAX_SCORE,
  POINT_BUY_COSTS,
  DEFAULT_ABILITY_SCORES,
} from "./point-buy";
import {
  ABILITY_NAMES,
  ABILITY_ABBREVIATIONS,
  type AbilityScores,
} from "../types/ability-scores.types";

// ─── calculatePointBuyCost ───────────────────────────────────────────────────

describe("calculatePointBuyCost", () => {
  it("should return correct costs for all valid scores (8–15)", () => {
    expect(calculatePointBuyCost(8)).toBe(0);
    expect(calculatePointBuyCost(9)).toBe(1);
    expect(calculatePointBuyCost(10)).toBe(2);
    expect(calculatePointBuyCost(11)).toBe(3);
    expect(calculatePointBuyCost(12)).toBe(4);
    expect(calculatePointBuyCost(13)).toBe(5);
    expect(calculatePointBuyCost(14)).toBe(7);
    expect(calculatePointBuyCost(15)).toBe(9);
  });

  it("should return -1 for scores below 8", () => {
    expect(calculatePointBuyCost(7)).toBe(-1);
    expect(calculatePointBuyCost(0)).toBe(-1);
    expect(calculatePointBuyCost(-1)).toBe(-1);
  });

  it("should return -1 for scores above 15", () => {
    expect(calculatePointBuyCost(16)).toBe(-1);
    expect(calculatePointBuyCost(20)).toBe(-1);
  });
});

// ─── validatePointBuy ────────────────────────────────────────────────────────

describe("validatePointBuy", () => {
  it("should validate a perfect 27-point allocation", () => {
    // Classic 15/14/13/12/10/8 = 9+7+5+4+2+0 = 27
    const scores: AbilityScores = {
      strength: 15,
      dexterity: 14,
      constitution: 13,
      intelligence: 12,
      wisdom: 10,
      charisma: 8,
    };

    const result = validatePointBuy(scores);

    expect(result.valid).toBe(true);
    expect(result.totalCost).toBe(27);
    expect(result.remaining).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(result.breakdown.strength).toBe(9);
    expect(result.breakdown.dexterity).toBe(7);
    expect(result.breakdown.constitution).toBe(5);
    expect(result.breakdown.intelligence).toBe(4);
    expect(result.breakdown.wisdom).toBe(2);
    expect(result.breakdown.charisma).toBe(0);
  });

  it("should validate all 8s (0 points spent)", () => {
    const result = validatePointBuy(DEFAULT_ABILITY_SCORES);

    expect(result.valid).toBe(true);
    expect(result.totalCost).toBe(0);
    expect(result.remaining).toBe(27);
  });

  it("should accept under-budget allocations", () => {
    const scores: AbilityScores = {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    };

    const result = validatePointBuy(scores);

    expect(result.valid).toBe(true);
    expect(result.totalCost).toBe(12); // 6 × 2
    expect(result.remaining).toBe(15);
  });

  it("should reject scores below 8", () => {
    const scores: AbilityScores = {
      strength: 7, // below min
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    };

    const result = validatePointBuy(scores);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain("below the minimum");
  });

  it("should reject scores above 15", () => {
    const scores: AbilityScores = {
      strength: 16, // above max
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    };

    const result = validatePointBuy(scores);

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("exceeds the maximum");
  });

  it("should reject over-budget allocations", () => {
    // All 15s = 6 × 9 = 54 points (way over 27)
    const scores: AbilityScores = {
      strength: 15,
      dexterity: 15,
      constitution: 15,
      intelligence: 15,
      wisdom: 15,
      charisma: 15,
    };

    const result = validatePointBuy(scores);

    expect(result.valid).toBe(false);
    expect(result.totalCost).toBe(54);
    expect(result.remaining).toBe(-27);
    expect(result.errors.some((e) => e.includes("exceeds the budget"))).toBe(
      true
    );
  });

  it("should reject non-integer scores", () => {
    const scores: AbilityScores = {
      strength: 10.5,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    };

    const result = validatePointBuy(scores);

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("whole number");
  });

  it("should collect multiple errors for multiple invalid scores", () => {
    const scores: AbilityScores = {
      strength: 7, // too low
      dexterity: 16, // too high
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    };

    const result = validatePointBuy(scores);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(2);
  });
});

// ─── calculateModifier ──────────────────────────────────────────────────────

describe("calculateModifier", () => {
  it("should return 0 for score 10 and 11", () => {
    expect(calculateModifier(10)).toBe(0);
    expect(calculateModifier(11)).toBe(0);
  });

  it("should return correct positive modifiers", () => {
    expect(calculateModifier(12)).toBe(1);
    expect(calculateModifier(13)).toBe(1);
    expect(calculateModifier(14)).toBe(2);
    expect(calculateModifier(15)).toBe(2);
    expect(calculateModifier(16)).toBe(3);
    expect(calculateModifier(17)).toBe(3);
    expect(calculateModifier(18)).toBe(4);
    expect(calculateModifier(19)).toBe(4);
    expect(calculateModifier(20)).toBe(5);
  });

  it("should return correct negative modifiers", () => {
    expect(calculateModifier(8)).toBe(-1);
    expect(calculateModifier(9)).toBe(-1);
    expect(calculateModifier(6)).toBe(-2);
    expect(calculateModifier(7)).toBe(-2);
    expect(calculateModifier(4)).toBe(-3);
    expect(calculateModifier(5)).toBe(-3);
    expect(calculateModifier(1)).toBe(-5);
  });

  it("should handle the extreme high score (30, monsters)", () => {
    expect(calculateModifier(30)).toBe(10);
  });
});

// ─── calculateHitPoints ─────────────────────────────────────────────────────

describe("calculateHitPoints", () => {
  it("should calculate HP for a Level 1 Fighter (d10, CON 14)", () => {
    // HP = 10 + 2 (CON mod) = 12
    const result = calculateHitPoints(10, 14, 1);

    expect(result.maxHp).toBe(12);
    expect(result.constitutionModifier).toBe(2);
    expect(result.hitDie).toBe(10);
    expect(result.level).toBe(1);
  });

  it("should calculate HP for a Level 5 Wizard (d6, CON 12)", () => {
    // Level 1: 6 + 1 = 7
    // Levels 2-5: 4 × (4 + 1) = 20
    // Total: 7 + 20 = 27
    const result = calculateHitPoints(6, 12, 5);

    expect(result.maxHp).toBe(27);
  });

  it("should calculate HP for a Level 1 Barbarian (d12, CON 15)", () => {
    // HP = 12 + 2 (CON mod for 15) = 14
    const result = calculateHitPoints(12, 15, 1);

    expect(result.maxHp).toBe(14);
  });

  it("should handle very low CON (minimum 1 HP per level)", () => {
    // d6 Wizard, CON 3 (modifier -4)
    // Level 1: 6 + (-4) = 2
    // Levels 2+: max(1, 4 + (-4)) = max(1, 0) = 1
    // Level 3: 2 + 2*1 = 4
    const result = calculateHitPoints(6, 3, 3);

    expect(result.maxHp).toBe(4);
    expect(result.constitutionModifier).toBe(-4);
  });

  it("should never return less than 1 HP", () => {
    // Edge case: CON 1 (modifier -5), d6
    // Level 1: max(1, 6 + (-5)) = max(1, 1) = 1
    const result = calculateHitPoints(6, 1, 1);

    expect(result.maxHp).toBeGreaterThanOrEqual(1);
  });

  it("should calculate HP correctly for a Level 10 Rogue (d8, CON 14)", () => {
    // Level 1: 8 + 2 = 10
    // Levels 2-10: 9 × (5 + 2) = 63
    // Total: 10 + 63 = 73
    const result = calculateHitPoints(8, 14, 10);

    expect(result.maxHp).toBe(73);
  });
});

// ─── calculateProficiencyBonus ───────────────────────────────────────────────

describe("calculateProficiencyBonus", () => {
  it("should return +2 for levels 1–4", () => {
    expect(calculateProficiencyBonus(1)).toBe(2);
    expect(calculateProficiencyBonus(2)).toBe(2);
    expect(calculateProficiencyBonus(3)).toBe(2);
    expect(calculateProficiencyBonus(4)).toBe(2);
  });

  it("should return +3 for levels 5–8", () => {
    expect(calculateProficiencyBonus(5)).toBe(3);
    expect(calculateProficiencyBonus(6)).toBe(3);
    expect(calculateProficiencyBonus(7)).toBe(3);
    expect(calculateProficiencyBonus(8)).toBe(3);
  });

  it("should return +4 for levels 9–12", () => {
    expect(calculateProficiencyBonus(9)).toBe(4);
    expect(calculateProficiencyBonus(10)).toBe(4);
    expect(calculateProficiencyBonus(11)).toBe(4);
    expect(calculateProficiencyBonus(12)).toBe(4);
  });

  it("should return +5 for levels 13–16", () => {
    expect(calculateProficiencyBonus(13)).toBe(5);
    expect(calculateProficiencyBonus(14)).toBe(5);
    expect(calculateProficiencyBonus(15)).toBe(5);
    expect(calculateProficiencyBonus(16)).toBe(5);
  });

  it("should return +6 for levels 17–20", () => {
    expect(calculateProficiencyBonus(17)).toBe(6);
    expect(calculateProficiencyBonus(18)).toBe(6);
    expect(calculateProficiencyBonus(19)).toBe(6);
    expect(calculateProficiencyBonus(20)).toBe(6);
  });
});

// ─── getXpRangeForLevel ─────────────────────────────────────────────────────

describe("getXpRangeForLevel", () => {
  it("should return [0, 299] for level 1 (floor of the table)", () => {
    expect(getXpRangeForLevel(1)).toEqual({ min: 0, max: 299 });
  });

  it("should return a mid-table range bounded by the next level's threshold", () => {
    // Level 5 floor = 6500; level 6 floor = 14000 → max = 13999
    expect(getXpRangeForLevel(5)).toEqual({ min: 6500, max: 13999 });
  });

  it("should return [355000, 355000] for the level 20 cap (no next level)", () => {
    expect(getXpRangeForLevel(20)).toEqual({ min: 355000, max: 355000 });
  });

  it("should default min to 0 for a level outside the table", () => {
    expect(getXpRangeForLevel(21)).toEqual({ min: 0, max: 355000 });
  });
});

// ─── Type and Constant Exports ───────────────────────────────────────────────

describe("ability-scores types and constants", () => {
  it("should export all 6 ability names", () => {
    expect(ABILITY_NAMES).toHaveLength(6);
    expect(ABILITY_NAMES).toContain("strength");
    expect(ABILITY_NAMES).toContain("dexterity");
    expect(ABILITY_NAMES).toContain("constitution");
    expect(ABILITY_NAMES).toContain("intelligence");
    expect(ABILITY_NAMES).toContain("wisdom");
    expect(ABILITY_NAMES).toContain("charisma");
  });

  it("should export correct abbreviations", () => {
    expect(ABILITY_ABBREVIATIONS.strength).toBe("STR");
    expect(ABILITY_ABBREVIATIONS.dexterity).toBe("DEX");
    expect(ABILITY_ABBREVIATIONS.constitution).toBe("CON");
    expect(ABILITY_ABBREVIATIONS.intelligence).toBe("INT");
    expect(ABILITY_ABBREVIATIONS.wisdom).toBe("WIS");
    expect(ABILITY_ABBREVIATIONS.charisma).toBe("CHA");
  });

  it("should have a budget of 27 points", () => {
    expect(POINT_BUY_BUDGET).toBe(27);
  });

  it("should have min score 8, max score 15", () => {
    expect(POINT_BUY_MIN_SCORE).toBe(8);
    expect(POINT_BUY_MAX_SCORE).toBe(15);
  });

  it("should have 8 entries in the cost table (scores 8–15)", () => {
    expect(Object.keys(POINT_BUY_COSTS)).toHaveLength(8);
  });

  it("should have all 6 default ability scores set to 8", () => {
    for (const ability of ABILITY_NAMES) {
      expect(DEFAULT_ABILITY_SCORES[ability]).toBe(8);
    }
  });
});
