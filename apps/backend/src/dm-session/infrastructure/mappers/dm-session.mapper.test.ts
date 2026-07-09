import { describe, it, expect } from "bun:test";
import { DmSessionMapper } from "./dm-session.mapper";
import { DmSession } from "../../domain/entities/dm-session.entity";

function buildSession() {
  return DmSession.create({
    userId: "user-1",
    title: "La cripta olvidada",
    campaignPrompt: "Un grupo de aventureros explora una cripta.",
    characters: [],
    architectureType: "mas",
  });
}

describe("DmSessionMapper.toResponse", () => {
  it("should include the full set of session fields", () => {
    const session = buildSession();
    const response = DmSessionMapper.toResponse(session);

    expect(response.id).toBe(session.id.toString());
    expect(response.title).toBe("La cripta olvidada");
    expect(response.campaignPrompt).toBe("Un grupo de aventureros explora una cripta.");
    expect(response.status).toBe("initializing");
    expect(response.memorySnapshot).toEqual({});
    expect(response.narrativeNotes).toEqual([]);
    expect(response.turnCount).toBe(0);
    expect(typeof response.createdAt).toBe("string");
  });

  it("should reflect accumulated state after applying a turn", () => {
    const session = buildSession().applyTurn({
      memorySnapshot: { npcs: ["Aldric"] },
      narrativeNotesDelta: [],
      inputTokens: 100,
      outputTokens: 200,
      latencyMs: 500,
    });

    const response = DmSessionMapper.toResponse(session);

    expect(response.status).toBe("active"); // initializing -> active on first turn
    expect(response.turnCount).toBe(1);
    expect(response.memorySnapshot).toEqual({ npcs: ["Aldric"] });
    expect(response.totalInputTokens).toBe(100);
  });
});

describe("DmSessionMapper.toSummaryResponse", () => {
  it("should omit campaignPrompt, memorySnapshot, and narrativeNotes", () => {
    const session = buildSession();
    const response = DmSessionMapper.toSummaryResponse(session);

    expect(response).not.toHaveProperty("campaignPrompt");
    expect(response).not.toHaveProperty("memorySnapshot");
    expect(response).not.toHaveProperty("narrativeNotes");
    expect(response.title).toBe("La cripta olvidada");
    expect(response.architectureType).toBe("mas");
  });
});
