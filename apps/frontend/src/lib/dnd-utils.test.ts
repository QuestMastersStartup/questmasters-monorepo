import { describe, it, expect } from "vitest";
import { nameToIndex, crToXp, formatCR } from "./dnd-utils";

describe("nameToIndex", () => {
  it("caso válido: convierte un nombre simple a slug en minúsculas", () => {
    expect(nameToIndex("Fireball")).toBe("fireball");
  });

  it("caso límite: colapsa espacios y símbolos en un solo guion, sin guiones al borde", () => {
    expect(nameToIndex("Bola de Fuego!!")).toBe("bola-de-fuego");
  });

  it("caso inválido: cadena vacía devuelve cadena vacía", () => {
    expect(nameToIndex("")).toBe("");
  });
});

describe("crToXp", () => {
  it("caso válido: devuelve el XP tabulado para un CR entero", () => {
    expect(crToXp(5)).toBe(1800);
  });

  it("caso límite: devuelve el XP tabulado para un CR fraccionario", () => {
    expect(crToXp(0.25)).toBe(50);
  });

  it("caso inválido: CR fuera de tabla devuelve 0", () => {
    expect(crToXp(999)).toBe(0);
  });
});

describe("formatCR", () => {
  it("caso válido: formatea un CR entero tal cual", () => {
    expect(formatCR(5)).toBe("5");
  });

  it("caso límite: formatea los CR fraccionarios como fracción legible", () => {
    expect(formatCR(0.125)).toBe("1/8");
    expect(formatCR(0.25)).toBe("1/4");
    expect(formatCR(0.5)).toBe("1/2");
  });

  it("caso válido: CR 0 se formatea como '0'", () => {
    expect(formatCR(0)).toBe("0");
  });
});
