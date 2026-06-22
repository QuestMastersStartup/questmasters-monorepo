import type { AbilityScores } from "@questmasters/dnd-rules";
import { authFetch } from "./api";

// ─── Tipos ────────────────────────────────────────────────────────────

export type ArchitectureType = "mas" | "monolithic";
export type DmSessionStatus = "initializing" | "active" | "paused" | "ended";

export interface CharacterSnapshot {
  name: string;
  race: string;
  class: string;
  background: string;
  level: number;
  backstory: string;
  alignment: string;
  personalityTraits: string;
  stats?: AbilityScores;
  skillProficiencies?: string[];
  expertiseSkills?: string[];
  jackOfAllTrades?: boolean;
  reliableTalent?: boolean;
  subclass?: string;
}

export interface NarrativeNote {
  type: "tension" | "coherence" | "plot_thread" | "warning";
  content: string;
  turn: number;
  timestamp: string;
}

export interface DmTurn {
  id: string;
  sessionId: string;
  turnNumber: number;
  role: "player" | "dm";
  playerInput: string | null;
  dmResponse: string;
  memorySnapshotAfter: Record<string, any>;
  narrativeNotesDelta: NarrativeNote[];
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  modelId: string;
  architectureType: ArchitectureType;
  createdAt: string;
}

export interface DmSessionSummary {
  id: string;
  userId: string;
  title: string;
  architectureType: ArchitectureType;
  status: DmSessionStatus;
  modelId: string;
  turnCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DmSessionDetail extends DmSessionSummary {
  campaignPrompt: string;
  characters: CharacterSnapshot[];
  memorySnapshot: Record<string, any>;
  narrativeNotes: NarrativeNote[];
  totalInputTokens: number;
  totalOutputTokens: number;
  totalLatencyMs: number;
  turns: DmTurn[];
}

export interface SessionMetrics {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalLatencyMs: number;
  turnCount: number;
  avgLatencyMs: number;
  architectureType: ArchitectureType;
  modelId: string;
  narrativeNotes: NarrativeNote[];
  memorySnapshot: Record<string, any>;
  turnBreakdown: DmTurn[];
}

/** Chunk del stream SSE.
 *  - 'session': emitido al crear una sesión (antes de los chunks del turno inicial).
 *  - 'player_input': emitido por auto-turn antes de los chunks del DM; contiene la
 *    acción generada automáticamente para el lado del jugador.
 */
export interface DmModelChunk {
  type: "session" | "player_input" | "delta" | "metadata" | "done" | "error";
  session?: Omit<DmSessionDetail, "turns">;
  /** type=player_input: texto de la acción auto-generada del jugador. */
  input?: string;
  delta?: string;
  metadata?: {
    memorySnapshot: Record<string, any>;
    narrativeNotesDelta: NarrativeNote[];
    usage: { inputTokens: number; outputTokens: number };
    latencyMs: number;
    modelId: string;
  };
  error?: string;
}

export interface CreateDmSessionRequest {
  title: string;
  campaignPrompt: string;
  characters: CharacterSnapshot[];
  architectureType: ArchitectureType;
  modelId?: string;
}

// ─── Helper de streaming SSE ──────────────────────────────────────────

/**
 * Convierte una Response SSE en un AsyncGenerator de DmModelChunks.
 */
export async function* streamDmResponse(
  response: Response,
): AsyncGenerator<DmModelChunk> {
  if (!response.body) {
    yield { type: "error", error: "La respuesta no tiene cuerpo streameable" };
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let separatorIndex: number;
      while ((separatorIndex = buffer.indexOf("\n\n")) !== -1) {
        const rawEvent = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + 2);

        const dataLines = rawEvent
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trim());
        if (dataLines.length === 0) continue;

        let chunk: DmModelChunk;
        try {
          chunk = JSON.parse(dataLines.join("\n"));
        } catch {
          continue;
        }

        yield chunk;
        if (chunk.type === "done" || chunk.type === "error") return;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Registro de streams iniciales pendientes: SessionInitModal crea la sesión,
 * guarda aquí el stream del primer turno y navega a /dm-sessions/:id, donde
 * la página lo recoge y lo consume sin perder chunks.
 */
const pendingInitialStreams = new Map<string, AsyncGenerator<DmModelChunk>>();

export function setPendingInitialStream(
  sessionId: string,
  stream: AsyncGenerator<DmModelChunk>,
): void {
  pendingInitialStreams.set(sessionId, stream);
}

export function takePendingInitialStream(
  sessionId: string,
): AsyncGenerator<DmModelChunk> | undefined {
  const stream = pendingInitialStreams.get(sessionId);
  pendingInitialStreams.delete(sessionId);
  return stream;
}

// ─── Llamadas API ─────────────────────────────────────────────────────

async function throwApiError(response: Response, fallback: string): Promise<never> {
  const errorData = await response.json().catch(() => ({}));
  throw new Error(errorData.message || fallback);
}

/**
 * Crea una sesión. El backend responde con un stream SSE cuyo primer evento
 * es la sesión creada, seguido de los chunks del turno inicial del DM.
 */
export async function createSession(data: CreateDmSessionRequest): Promise<{
  session: Omit<DmSessionDetail, "turns">;
  stream: AsyncGenerator<DmModelChunk>;
}> {
  const response = await authFetch("/api/dm-sessions", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) await throwApiError(response, "Error al crear la sesión");

  const stream = streamDmResponse(response);
  const first = await stream.next();

  if (first.done || first.value.type !== "session" || !first.value.session) {
    throw new Error("El servidor no devolvió la sesión creada");
  }

  return { session: first.value.session, stream };
}

export async function getSessions(): Promise<DmSessionSummary[]> {
  const response = await authFetch("/api/dm-sessions");
  if (!response.ok) await throwApiError(response, "Error al listar sesiones");
  return response.json();
}

export async function getSession(id: string): Promise<DmSessionDetail> {
  const response = await authFetch(`/api/dm-sessions/${id}`);
  if (!response.ok) await throwApiError(response, "Sesión no encontrada");
  return response.json();
}

/** Envía un turno del jugador. Devuelve el stream SSE de la respuesta del DM. */
export async function sendTurn(
  id: string,
  playerInput: string,
  signal?: AbortSignal,
): Promise<AsyncGenerator<DmModelChunk>> {
  const response = await authFetch(`/api/dm-sessions/${id}/turns`, {
    method: "POST",
    body: JSON.stringify({ playerInput }),
    signal,
  });

  if (!response.ok) await throwApiError(response, "Error al enviar el turno");

  return streamDmResponse(response);
}

export async function getMetrics(id: string): Promise<SessionMetrics> {
  const response = await authFetch(`/api/dm-sessions/${id}/metrics`);
  if (!response.ok) await throwApiError(response, "Error al obtener métricas");
  return response.json();
}

/** Genera un turno automático: el backend produce una acción de jugador (stub/IA)
 *  y luego responde como DM. El stream emite primero `player_input` y después
 *  los chunks normales de delta/metadata/done. */
export async function simulateTurn(
  id: string,
  signal?: AbortSignal,
): Promise<AsyncGenerator<DmModelChunk>> {
  const response = await authFetch(`/api/dm-sessions/${id}/auto-turn`, {
    method: "POST",
    signal,
  });

  if (!response.ok) await throwApiError(response, "Error al simular el turno");

  return streamDmResponse(response);
}

export async function endSession(id: string): Promise<DmSessionSummary> {
  const response = await authFetch(`/api/dm-sessions/${id}/end`, {
    method: "POST",
  });
  if (!response.ok) await throwApiError(response, "Error al terminar la sesión");
  return response.json();
}

export async function deleteSession(id: string): Promise<void> {
  const response = await authFetch(`/api/dm-sessions/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) await throwApiError(response, "Error al eliminar la sesión");
}
