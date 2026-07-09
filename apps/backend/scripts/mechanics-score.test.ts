import { describe, it, expect } from "vitest";
import { scoreTurn, type TurnInput } from "./mechanics-score";

const character: TurnInput["character"] = {
  stats: {
    strength: 10,
    dexterity: 16,
    constitution: 12,
    intelligence: 10,
    wisdom: 14,
    charisma: 8,
  },
  level: 5,
  skillProficiencies: ["sigilo"],
  expertiseSkills: [],
};

describe("scoreTurn", () => {
  it("marca sin_chequeo cuando el DM no propone ninguna tirada", () => {
    const result = scoreTurn({ turnId: "t1", dmResponse: "Caminas hacia la taberna." });
    expect(result.puntajeMecanicas).toBeNull();
    expect(result.detalle).toBe("sin_chequeo");
  });

  it("puntúa 1 cuando el chequeo se reconoce pero no hay resolución auto-rolled", () => {
    const result = scoreTurn({
      turnId: "t2",
      dmResponse: "Intentas escabullirte. Haz una tirada de Sigilo (CD 15).",
    });
    expect(result.puntajeMecanicas).toBe(1);
    expect(result.detalle).toBe("chequeo_reconocido_sin_resolucion");
  });

  it("puntúa 1 cuando la resolución auto-rolled es aritméticamente consistente", () => {
    // dex 16 → modificador +3; nivel 5 → bono de competencia +3; proficiente en sigilo.
    const result = scoreTurn({
      turnId: "t3",
      dmResponse: "Intentas escabullirte. Haz una tirada de Sigilo (CD 15).",
      nextPlayerInput: "[Tirada de Sigilo: d20(14) +3 +3 prof = 20 vs CD 15 — Éxito]",
      character,
    });
    expect(result.puntajeMecanicas).toBe(1);
    expect(result.detalle).toBe("resolucion_consistente");
  });

  it("puntúa 0 cuando el total reportado no coincide con la ficha del personaje", () => {
    const result = scoreTurn({
      turnId: "t4",
      dmResponse: "Intentas escabullirte. Haz una tirada de Sigilo (CD 15).",
      // Total real esperado sería 20 (ver test anterior), no 12 — inconsistente.
      nextPlayerInput: "[Tirada de Sigilo: d20(14) +3 +3 prof = 12 vs CD 15 — Fallo]",
      character,
    });
    expect(result.puntajeMecanicas).toBe(0);
    expect(result.detalle).toContain("inconsistente");
  });
});
