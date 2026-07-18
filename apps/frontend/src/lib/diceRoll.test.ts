import { describe, it, expect, vi, afterEach } from "vitest";
import {
  parseSkillCheck,
  matchSkill,
  formatRollResult,
  rollSkillCheck,
  type CharacterRollContext,
} from "./diceRoll";

describe("parseSkillCheck", () => {
  it("caso válido: reconoce una tirada de habilidad con CD explícita", () => {
    const check = parseSkillCheck("Haz una tirada de Sigilo (CD 15) para no ser visto.");
    expect(check).toEqual({ skillName: "Sigilo", ability: "dexterity", dc: 15 });
  });

  it("caso válido: reconoce una salvación con CD explícita", () => {
    const check = parseSkillCheck("Haz una tirada de Salvación de Destreza (CD 12).");
    expect(check).toEqual({
      skillName: "Salvación de Destreza",
      ability: "dexterity",
      dc: 12,
      isSavingThrow: true,
    });
  });

  it("caso límite: reconoce una salvación aunque el DM la envuelva en markdown", () => {
    const check = parseSkillCheck(
      "Haz una **tirada de salvación de Destreza** (CD 14) para esquivar la trampa.",
    );
    expect(check).toEqual({
      skillName: "Salvación de Destreza",
      ability: "dexterity",
      dc: 14,
      isSavingThrow: true,
    });
  });

  it("caso límite: reconoce una salvación con cláusula final tras la CD (mayúscula en 'Salvación')", () => {
    const check = parseSkillCheck(
      "Haz una tirada de Salvación de Destreza (CD 13) para esquivar el primer impacto lateral.",
    );
    expect(check).toEqual({
      skillName: "Salvación de Destreza",
      ability: "dexterity",
      dc: 13,
      isSavingThrow: true,
    });
  });

  it("caso límite: reconoce una salvación aunque el acento venga en forma NFD (o + acento combinante)", () => {
    // Gemma a veces emite unicode descompuesto: 'o' (U+006F) + acento agudo combinante (U+0301),
    // en vez de la forma precompuesta 'ó' (U+00F3). Visualmente idéntico, bytes distintos.
    const nfdText = "Haz una tirada de Salvaci\u006F\u0301n de Destreza (CD 13).";
    const check = parseSkillCheck(nfdText);
    expect(check).toEqual({
      skillName: "Salvación de Destreza",
      ability: "dexterity",
      dc: 13,
      isSavingThrow: true,
    });
  });

  it("caso límite: reconoce una salvación con espacio de ancho fijo (NBSP) entre palabras", () => {
    const nbspText = "Haz una tirada de salvaci\u00F3n\u00A0de\u00A0Destreza (CD 13).";
    const check = parseSkillCheck(nbspText);
    expect(check).toEqual({
      skillName: "Salvación de Destreza",
      ability: "dexterity",
      dc: 13,
      isSavingThrow: true,
    });
  });

  it("caso inválido: texto sin ninguna tirada devuelve null", () => {
    expect(parseSkillCheck("Caminas por el pasillo en silencio.")).toBeNull();
  });
});

describe("matchSkill", () => {
  it("caso válido: coincide por nombre en español exacto", () => {
    expect(matchSkill("sigilo", ["sigilo"])).toBe(true);
  });

  it("caso límite: coincide traduciendo desde un índice tipo 'skill-stealth'", () => {
    expect(matchSkill("sigilo", ["skill-stealth"])).toBe(true);
  });

  it("caso inválido: ninguna proficiencia coincide", () => {
    expect(matchSkill("sigilo", ["skill-athletics"])).toBe(false);
  });
});

describe("rollSkillCheck", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const ctx: CharacterRollContext = {
    stats: { strength: 10, dexterity: 16, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
    level: 5, // proficiency bonus +3
    skillProficiencies: ["sigilo"],
    expertiseSkills: [],
    jackOfAllTrades: false,
    reliableTalent: false,
  };

  it("caso válido: aplica modificador de habilidad + bono de competencia cuando es proficiente", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5); // d20 = floor(0.5*20)+1 = 11

    const roll = rollSkillCheck("dexterity", ctx, "sigilo");

    expect(roll.d20).toBe(11);
    expect(roll.modifier).toBe(3); // DEX 16 -> +3
    expect(roll.proficiencyBonus).toBe(3); // nivel 5 -> +3, proficiente
    expect(roll.total).toBe(17);
    expect(roll.isProficient).toBe(true);
  });

  it("caso límite: Reliable Talent sube un d20 bajo (<10) a 10 cuando es proficiente", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.05); // d20 = floor(0.05*20)+1 = 2

    const reliableCtx = { ...ctx, reliableTalent: true };
    const roll = rollSkillCheck("dexterity", reliableCtx, "sigilo");

    expect(roll.d20).toBe(10); // el 2 original se sube a 10
    expect(roll.isReliable).toBe(true);
  });

  it("caso inválido: salvación no aplica bono de competencia aunque sea proficiente en la habilidad", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    const roll = rollSkillCheck("dexterity", ctx, "sigilo", /* isSavingThrow */ true);

    expect(roll.proficiencyBonus).toBe(0);
    expect(roll.total).toBe(roll.d20 + roll.modifier);
  });
});

describe("formatRollResult", () => {
  it("caso válido: formatea un éxito con el desglose completo", () => {
    const check = { skillName: "Sigilo", ability: "dexterity" as const, dc: 15 };
    const roll = {
      d20: 14,
      modifier: 3,
      proficiencyBonus: 3,
      total: 20,
      isProficient: true,
      isExpertise: false,
      isReliable: false,
    };

    expect(formatRollResult(check, roll)).toBe(
      "[Tirada de Sigilo: d20(14) +3 +3 prof = 20 vs CD 15 — Éxito]",
    );
  });

  it("caso límite: formatea un fallo cuando el total no alcanza la CD", () => {
    const check = { skillName: "Sigilo", ability: "dexterity" as const, dc: 25 };
    const roll = {
      d20: 5,
      modifier: 3,
      proficiencyBonus: 0,
      total: 8,
      isProficient: false,
      isExpertise: false,
      isReliable: false,
    };

    expect(formatRollResult(check, roll)).toContain("— Fallo]");
  });
});
