import { describe, it, expect } from "vitest";
import { validatePrerequisites } from "./validator";
import { Prerequisite, ValidationContext } from "../types/prerequisites.types";

describe("validatePrerequisites", () => {
  const heroContext: ValidationContext = {
    character: {
      stats: { str: 15, dex: 10 },
      level: 5,
      race: "human",
      classes: ["fighter"],
      proficiencies: ["heavy-armor"],
      feats: [],
    },
    strict: true, // Standard mode
  };

  const weakContext: ValidationContext = {
    character: {
      stats: { str: 8, dex: 10 },
      level: 1,
      race: "human",
      classes: ["wizard"],
      proficiencies: [],
      feats: [],
    },
    strict: true,
  };

  const heavyArmorPrereq: Prerequisite = {
    type: "proficiency",
    target: "heavy-armor",
    description: "Must have Heavy Armor Proficiency",
  };

  const str13Prereq: Prerequisite = {
    type: "ability_score",
    ability: "str",
    min_score: 13,
  };

  it("should pass when requirements are met", () => {
    const result = validatePrerequisites(
      [heavyArmorPrereq, str13Prereq],
      heroContext,
    );
    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should fail when requirements are not met (Strict Mode)", () => {
    const result = validatePrerequisites([heavyArmorPrereq], weakContext);
    expect(result.success).toBe(false);
    expect(result.errors).toContain("Must have Heavy Armor Proficiency");
  });

  it("should PASS but be IGNORED when requirements are not met in FREE MODE", () => {
    // Override strict mode to false (Free Mode)
    const freeModeContext = { ...weakContext, strict: false };

    const result = validatePrerequisites([heavyArmorPrereq], freeModeContext);

    // Crucial: It acts as "success" for the blocking logic
    expect(result.success).toBe(true);
    // But flags it as ignored for the UI
    expect(result.ignored).toBe(true);
    // And still keeps the error explanation
    expect(result.errors).toHaveLength(1);
  });

  it("should pass a 'level' prerequisite when the character meets the minimum level", () => {
    const level5Prereq: Prerequisite = { type: "level", min_level: 5 };
    const result = validatePrerequisites([level5Prereq], heroContext); // heroContext is level 5
    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should fail a 'level' prerequisite when the character is below the minimum level", () => {
    const level5Prereq: Prerequisite = { type: "level", min_level: 5 };
    const result = validatePrerequisites([level5Prereq], weakContext); // weakContext is level 1
    expect(result.success).toBe(false);
    expect(result.errors).toContain("Requires Level 5");
  });

  it("should pass silently on a prerequisite type not handled by the switch (e.g. 'race')", () => {
    const unknownPrereq: Prerequisite = { type: "race" };
    const result = validatePrerequisites([unknownPrereq], weakContext);
    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
