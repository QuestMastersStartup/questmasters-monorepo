import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { DmSession } from "./DmSession";
import type { DmSessionDetail } from "../lib/dmSessionApi";

vi.mock("../lib/dmSessionApi", () => ({
  getSession: vi.fn(),
  getMetrics: vi.fn(),
  sendTurn: vi.fn(),
  simulateTurn: vi.fn(),
  endSession: vi.fn(),
  retryInitialize: vi.fn(),
  takePendingInitialStream: vi.fn(() => null),
}));

import { getSession } from "../lib/dmSessionApi";

function makeSession(overrides: Partial<DmSessionDetail> = {}): DmSessionDetail {
  return {
    id: "session-1",
    userId: "user-1",
    title: "La Cripta Olvidada",
    architectureType: "mas",
    status: "active",
    modelId: "gemma-4-26B-A4B-it",
    turnCount: 1,
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T10:00:00.000Z",
    campaignPrompt: "Una mazmorra olvidada",
    characters: [
      {
        name: "Kaelen",
        race: "Elfo",
        class: "Explorador",
        background: "Forastero",
        level: 3,
        backstory: "Creció en el bosque de Silverwood.",
        alignment: "Neutral Bueno",
        personalityTraits: "Cauteloso y observador",
      },
    ],
    memorySnapshot: {},
    narrativeNotes: [],
    totalInputTokens: 100,
    totalOutputTokens: 200,
    totalLatencyMs: 5000,
    turns: [
      {
        id: "turn-1",
        sessionId: "session-1",
        turnNumber: 1,
        role: "dm",
        playerInput: "Abro la puerta con cautela.",
        dmResponse: "La puerta cruje y revela un pasillo oscuro.",
        memorySnapshotAfter: {},
        narrativeNotesDelta: [],
        inputTokens: 50,
        outputTokens: 80,
        latencyMs: 2500,
        modelId: "gemma-4-26B-A4B-it",
        architectureType: "mas",
        createdAt: "2026-01-01T10:01:00.000Z",
      },
    ],
    ...overrides,
  };
}

function renderPage(id = "session-1") {
  return render(
    <MemoryRouter initialEntries={[`/dm-sessions/${id}`]}>
      <Routes>
        <Route path="/dm-sessions/:id" element={<DmSession />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  // jsdom no implementa scrollIntoView; el efecto de auto-scroll del chat lo invoca en cada render.
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("HU-001: UI de Chat Principal — input y visualización de mensajes", () => {
  it("caso válido: muestra los turnos existentes y deja el input habilitado", async () => {
    vi.mocked(getSession).mockResolvedValue(makeSession());

    renderPage();

    expect(await screen.findByText("La Cripta Olvidada")).toBeTruthy();
    expect(screen.getByText("Abro la puerta con cautela.")).toBeTruthy();
    expect(screen.getByText("La puerta cruje y revela un pasillo oscuro.")).toBeTruthy();

    const input = screen.getByPlaceholderText("Describe la acción de tu personaje...") as HTMLInputElement;
    expect(input.disabled).toBe(false);
  });

  it("caso límite: sesión sin turnos aún no rompe el render ni el input", async () => {
    vi.mocked(getSession).mockResolvedValue(makeSession({ turns: [], turnCount: 0 }));

    renderPage();

    const input = (await screen.findByPlaceholderText(
      "Describe la acción de tu personaje...",
    )) as HTMLInputElement;
    expect(input.disabled).toBe(false);
    expect(screen.queryByText("Abro la puerta con cautela.")).toBeNull();
  });

  it("caso inválido: fallo al cargar la sesión muestra un estado de error, no un crash", async () => {
    vi.mocked(getSession).mockRejectedValue(new Error("Network error"));

    renderPage();

    expect(await screen.findByText("Network error")).toBeTruthy();
    expect(screen.getByText("Volver a sesiones")).toBeTruthy();
  });
});

describe("HU-004: Exportador de Logs — botón de descarga", () => {
  it("caso válido: exporta un Markdown con título, personajes y transcripción", async () => {
    vi.mocked(getSession).mockResolvedValue(makeSession());

    const blobs: Blob[] = [];
    vi.stubGlobal("URL", {
      createObjectURL: (b: Blob) => {
        blobs.push(b);
        return "blob:mock-url";
      },
      revokeObjectURL: vi.fn(),
    });

    renderPage();
    const exportButton = await screen.findByTitle("Exportar chat");
    fireEvent.click(exportButton);

    expect(blobs).toHaveLength(1);
    const content = await blobs[0].text();
    expect(content).toContain("# La Cripta Olvidada");
    expect(content).toContain("- **Kaelen** — Elfo Explorador (Nivel 3)");
    expect(content).toContain("## Transcripción");
    expect(content).toContain("> Abro la puerta con cautela.");
    expect(content).toContain("> La puerta cruje y revela un pasillo oscuro.");
  });

  it("caso límite: sin turnos, el botón de exportar ni siquiera se muestra", async () => {
    vi.mocked(getSession).mockResolvedValue(makeSession({ turns: [], turnCount: 0 }));

    renderPage();
    await screen.findByPlaceholderText("Describe la acción de tu personaje...");

    expect(screen.queryByTitle("Exportar chat")).toBeNull();
  });

  it("caso inválido: input del jugador con saltos de línea se exporta como blockquote sin romper el formato", async () => {
    vi.mocked(getSession).mockResolvedValue(
      makeSession({
        turns: [
          {
            id: "turn-1",
            sessionId: "session-1",
            turnNumber: 1,
            role: "dm",
            playerInput: "Miro a la izquierda.\nLuego miro a la derecha.",
            dmResponse: "No ves nada fuera de lo común.",
            memorySnapshotAfter: {},
            narrativeNotesDelta: [],
            inputTokens: 10,
            outputTokens: 10,
            latencyMs: 100,
            modelId: "gemma-4-26B-A4B-it",
            architectureType: "mas",
            createdAt: "2026-01-01T10:01:00.000Z",
          },
        ],
      }),
    );

    const blobs: Blob[] = [];
    vi.stubGlobal("URL", {
      createObjectURL: (b: Blob) => {
        blobs.push(b);
        return "blob:mock-url";
      },
      revokeObjectURL: vi.fn(),
    });

    renderPage();
    const exportButton = await screen.findByTitle("Exportar chat");
    fireEvent.click(exportButton);

    const content = await blobs[0].text();
    expect(content).toContain("> Miro a la izquierda.\n> Luego miro a la derecha.");
  });
});
