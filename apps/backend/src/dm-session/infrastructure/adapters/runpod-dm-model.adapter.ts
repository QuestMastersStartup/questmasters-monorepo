import type {
  DmModelChunk,
  DmModelProvider,
  DmModelRequest,
} from '../../domain/ports/dm-model.provider';
import { logger } from '../../../shared/infrastructure/logger';

const RUNPOD_BASE = 'https://api.runpod.ai/v2';

interface RunpodJobResponse {
  id: string;
  status: string;
}

interface RunpodStreamEvent {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  stream?: { output: string }[];
  error?: string;
}

/** Chunk tal como lo serializa handler.py (snake_case) */
interface PythonChunk {
  type: 'delta' | 'metadata' | 'done' | 'error';
  content?: string;
  message?: string;
  memory_snapshot?: { l2_episode_ids: string[]; l3_entity_ids: string[] };
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  latency_ms?: number;
}

export class RunpodDmModelAdapter implements DmModelProvider {
  constructor(
    private readonly endpointId: string,
    private readonly apiKey: string,
  ) {}

  async *generateTurn(request: DmModelRequest): AsyncGenerator<DmModelChunk> {
    const jobId = await this.launchJob(request);
    if (!jobId) {
      yield { type: 'error', error: 'RunPod job launch failed' };
      return;
    }
    yield* this.readStream(jobId, request.modelId);
  }

  // ─── Lanzar job ──────────────────────────────────────────────────────

  private async launchJob(request: DmModelRequest): Promise<string | null> {
    let response: Response;
    try {
      response = await fetch(`${RUNPOD_BASE}/${this.endpointId}/run`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ input: this.toSnakeCase(request) }),
      });
    } catch (e) {
      logger.error('RunPod /run unreachable', { error: String(e) });
      return null;
    }

    if (!response.ok) {
      logger.error('RunPod /run error', { status: response.status });
      return null;
    }

    const body = (await response.json()) as RunpodJobResponse;
    return body.id ?? null;
  }

  // ─── Leer stream SSE ─────────────────────────────────────────────────

  private async *readStream(
    jobId: string,
    modelId: string,
  ): AsyncGenerator<DmModelChunk> {
    let streamResponse: Response;
    try {
      streamResponse = await fetch(`${RUNPOD_BASE}/${this.endpointId}/stream/${jobId}`, {
        headers: this.headers(),
      });
    } catch (e) {
      logger.error('RunPod /stream unreachable', { jobId, error: String(e) });
      yield { type: 'error', error: 'RunPod stream unreachable' };
      return;
    }

    if (!streamResponse.ok || !streamResponse.body) {
      yield { type: 'error', error: `RunPod stream status ${streamResponse.status}` };
      return;
    }

    const reader = streamResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const raw = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);

          const event = this.parseSseEvent(raw);
          if (!event) continue;

          for (const item of event.stream ?? []) {
            const chunk = this.mapChunk(item.output, modelId);
            if (chunk) yield chunk;
          }

          if (event.status === 'FAILED' || event.error) {
            yield { type: 'error', error: event.error ?? 'RunPod job failed' };
            return;
          }
          if (event.status === 'COMPLETED') return;
        }
      }
    } catch (e) {
      logger.error('RunPod stream interrupted', { jobId, error: String(e) });
      yield { type: 'error', error: 'RunPod stream interrupted' };
    } finally {
      reader.releaseLock();
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  private parseSseEvent(raw: string): RunpodStreamEvent | null {
    const data = raw
      .split('\n')
      .filter((l) => l.startsWith('data:'))
      .map((l) => l.slice(5).trim())
      .join('');
    if (!data) return null;
    try {
      return JSON.parse(data) as RunpodStreamEvent;
    } catch {
      logger.warn('Unparseable RunPod SSE event', { raw });
      return null;
    }
  }

  private mapChunk(output: string, modelId: string): DmModelChunk | null {
    let python: PythonChunk;
    try {
      python = JSON.parse(output) as PythonChunk;
    } catch {
      return null;
    }

    if (python.type === 'delta') {
      return { type: 'delta', delta: python.content ?? '' };
    }
    if (python.type === 'metadata') {
      return {
        type: 'metadata',
        metadata: {
          memorySnapshot: python.memory_snapshot ?? {},
          narrativeNotesDelta: [],
          usage: {
            inputTokens: python.usage?.prompt_tokens ?? 0,
            outputTokens: python.usage?.completion_tokens ?? 0,
          },
          latencyMs: python.latency_ms ?? 0,
          modelId,
        },
      };
    }
    if (python.type === 'done') return { type: 'done' };
    if (python.type === 'error') return { type: 'error', error: python.message };
    return null;
  }

  /** Convierte el request camelCase de TypeScript al snake_case que espera Python. */
  private toSnakeCase(r: DmModelRequest): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      session_id: r.sessionId,
      architecture_type: r.architectureType,
      model_id: r.modelId,
      campaign_prompt: r.campaignPrompt,
      characters: r.characters,
      conversation_history: r.conversationHistory,
      player_input: r.playerInput,
      current_memory_snapshot: r.currentMemorySnapshot,
    };
    if (r.routeDecision) {
      payload.route_decision = r.routeDecision;
    }
    return payload;
  }
}
