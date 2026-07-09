import { describe, it, expect } from "bun:test";
import { CharacterMapper } from "./character.mapper";
import { Character } from "../../domain/entities/character.entity";

const baseStats = {
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
};

function buildCharacter(overrides: Partial<Parameters<typeof Character.create>[0]> = {}) {
  return Character.create({
    userId: "user-1",
    name: "Aria",
    stats: baseStats,
    hitPoints: 10,
    ...overrides,
  });
}

describe("CharacterMapper.toResponse", () => {
  it("should map a full character to a plain response object", () => {
    const character = buildCharacter({
      campaignId: "11111111-1111-4111-8111-111111111111",
      raceAssetId: "22222222-2222-4222-8222-222222222222",
    });

    const response = CharacterMapper.toResponse(character);

    expect(response.name).toBe("Aria");
    expect(response.campaignId).toBe("11111111-1111-4111-8111-111111111111");
    expect(response.raceAssetId).toBe("22222222-2222-4222-8222-222222222222");
    expect(response.status).toBe("active");
    expect(typeof response.createdAt).toBe("string");
  });

  it("should map absent optional asset ids to null instead of undefined", () => {
    const character = buildCharacter(); // no campaignId/raceAssetId/classAssetId
    const response = CharacterMapper.toResponse(character);

    expect(response.campaignId).toBeNull();
    expect(response.raceAssetId).toBeNull();
    expect(response.classAssetId).toBeNull();
  });
});

describe("CharacterMapper.toEnrichedResponse", () => {
  it("should resolve asset names from the provided lookup map", () => {
    const character = buildCharacter({
      raceAssetId: "22222222-2222-4222-8222-222222222222",
      classAssetId: "33333333-3333-4333-8333-333333333333",
    });
    const assetNames = new Map([
      ["22222222-2222-4222-8222-222222222222", "Elfo"],
      ["33333333-3333-4333-8333-333333333333", "Explorador"],
    ]);

    const response = CharacterMapper.toEnrichedResponse(character, assetNames);

    expect(response.raceName).toBe("Elfo");
    expect(response.className).toBe("Explorador");
    expect(response.backgroundName).toBeNull(); // no backgroundAssetId set
  });

  it("should return null for an asset id present but missing from the lookup map", () => {
    const character = buildCharacter({
      raceAssetId: "99999999-9999-4999-8999-999999999999",
    });

    const response = CharacterMapper.toEnrichedResponse(character, new Map());

    expect(response.raceName).toBeNull();
  });
});
