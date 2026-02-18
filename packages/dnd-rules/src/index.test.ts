import { describe, it, expect } from "vitest";
import { AssetType } from "./index";

describe("dnd-rules core", () => {
  it("should export AssetType enum", () => {
    expect(AssetType).toBeDefined();
    expect(AssetType.CLASS).toBe("class");
    expect(AssetType.SPELL).toBe("spell");
  });

  it("should have correct AssetType count", () => {
    // Basic sanity check to ensure we haven't accidentally deleted types
    const keys = Object.keys(AssetType);
    expect(keys.length).toBeGreaterThan(10);
  });
});
