import { describe, it, expect } from "vitest";
import { tokenize, distinctN, scoreTurn } from "./distinct-ngrams";

describe("tokenize", () => {
  it("separa en minúsculas y preserva tildes/ñ", () => {
    expect(tokenize("¡El PÑJ corrió, saltó!")).toEqual(["el", "pñj", "corrió", "saltó"]);
  });
});

describe("distinctN", () => {
  it("da 1.0 cuando no hay repeticiones", () => {
    expect(distinctN(["a", "b", "c"], 1)).toBe(1);
  });

  it("detecta repetición de unigramas", () => {
    expect(distinctN(["a", "a", "b"], 1)).toBeCloseTo(2 / 3);
  });

  it("devuelve null si el texto es más corto que n", () => {
    expect(distinctN(["a"], 2)).toBeNull();
  });
});

describe("scoreTurn", () => {
  it("calcula distinct-1 y distinct-2 de la narración", () => {
    const result = scoreTurn({ turnId: "t1", dmResponse: "el gato el gato corre" });
    // tokens: el gato el gato corre → distinct-1 = {el,gato,corre}/5 = 3/5
    expect(result.distinct1).toBeCloseTo(3 / 5);
    // bigramas: "el gato","gato el","el gato","gato corre" → 3 únicos/4 = 3/4
    expect(result.distinct2).toBeCloseTo(3 / 4);
  });
});
