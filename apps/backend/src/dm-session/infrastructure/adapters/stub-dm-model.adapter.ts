import type {
  DmModelChunk,
  DmModelProvider,
  DmModelRequest,
} from '../../domain/ports/dm-model.provider';
import { logger } from '../../../shared/infrastructure/logger';

/**
 * Adaptador stub del proveedor de modelo DM.
 *
 * - Sin endpoint configurado → modo simulación: respuesta narrativa
 *   determinista en 3-5 chunks con 100ms de delay. Nunca falla.
 * - Con endpoint → POST {endpoint}/generate con el DmModelRequest y
 *   re-emite los eventos SSE (delta/metadata/done) como AsyncGenerator.
 *
 * Protocolo HTTP que el endpoint real debe implementar:
 *   POST {endpoint}/generate
 *   Body: DmModelRequest (JSON)
 *   Response: text/event-stream
 *     data: {"type":"delta","delta":"texto parcial..."}\n\n
 *     data: {"type":"metadata","metadata":{...}}\n\n
 *     data: {"type":"done"}\n\n
 */
export class StubDmModelAdapter implements DmModelProvider {
  constructor(private readonly endpoint?: string) {}

  async *generateTurn(request: DmModelRequest): AsyncGenerator<DmModelChunk> {
    if (this.endpoint) {
      yield* this.forwardToEndpoint(request);
    } else {
      yield* this.simulate(request);
    }
  }

  // ─── Modo simulación (sin endpoint) ────────────────────────────────

  private async *simulate(request: DmModelRequest): AsyncGenerator<DmModelChunk> {
    const startedAt = Date.now();
    const parts = this.buildSimulatedNarrative(request);

    for (const part of parts) {
      await this.delay(100);
      yield { type: 'delta', delta: part };
    }

    const fullText = parts.join('');
    const inputTokens = this.estimateTokens(
      request.campaignPrompt +
        request.conversationHistory.map((m) => m.content).join('') +
        (request.playerInput ?? ''),
    );
    const outputTokens = this.estimateTokens(fullText);

    yield {
      type: 'metadata',
      metadata: {
        memorySnapshot: {
          ...request.currentMemorySnapshot,
          _stub: true,
          lastArchitecture: request.architectureType,
          exchangeCount:
            ((request.currentMemorySnapshot?.exchangeCount as number) ?? 0) + 1,
        },
        narrativeNotesDelta: [],
        usage: { inputTokens, outputTokens },
        latencyMs: Date.now() - startedAt,
        modelId: request.modelId,
      },
    };

    yield { type: 'done' };
  }

  private buildSimulatedNarrative(request: DmModelRequest): string[] {
    const names = request.characters.map((c) => c.name).join(', ');

    if (request.playerInput === null) {
      return [
        `*(respuesta simulada — sin orquestación ${request.architectureType} conectada)*\n\n`,
        `La niebla se disipa lentamente sobre el camino mientras ${names} `,
        `llegan a las puertas de una aldea en silencio. `,
        `Las antorchas parpadean sin viento, y un cuervo observa desde el arco de piedra. `,
        `¿Qué hacéis?`,
      ];
    }

    return [
      `*(respuesta simulada — sin orquestación ${request.architectureType} conectada)*\n\n`,
      `El Dungeon Master considera vuestra acción: "${request.playerInput.slice(0, 80)}". `,
      `El mundo reacciona a vuestro alrededor, `,
      `y las consecuencias de vuestra decisión empiezan a tomar forma. `,
      `¿Cuál es vuestro siguiente movimiento?`,
    ];
  }

  // ─── Modo reenvío SSE (con endpoint) ───────────────────────────────

  private async *forwardToEndpoint(request: DmModelRequest): AsyncGenerator<DmModelChunk> {
    let response: Response;
    try {
      response = await fetch(`${this.endpoint}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
    } catch (e) {
      logger.error('DM model endpoint unreachable', {
        endpoint: this.endpoint,
        error: String(e),
      });
      yield { type: 'error', error: 'MODEL_OFFLINE' };
      return;
    }

    if (!response.ok || !response.body) {
      logger.error('DM model endpoint returned an error', {
        endpoint: this.endpoint,
        status: response.status,
      });
      yield { type: 'error', error: 'MODEL_OFFLINE' };
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Eventos SSE separados por doble salto de línea
        let separatorIndex: number;
        while ((separatorIndex = buffer.indexOf('\n\n')) !== -1) {
          const rawEvent = buffer.slice(0, separatorIndex);
          buffer = buffer.slice(separatorIndex + 2);

          const chunk = this.parseSseEvent(rawEvent);
          if (!chunk) continue;

          yield chunk;
          if (chunk.type === 'done' || chunk.type === 'error') return;
        }
      }
    } catch (e) {
      logger.error('DM model stream interrupted', {
        endpoint: this.endpoint,
        error: String(e),
      });
      yield { type: 'error', error: 'Model stream interrupted' };
    } finally {
      reader.releaseLock();
    }
  }

  private parseSseEvent(rawEvent: string): DmModelChunk | null {
    const dataLines = rawEvent
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trim());

    if (dataLines.length === 0) return null;

    try {
      return JSON.parse(dataLines.join('\n')) as DmModelChunk;
    } catch {
      logger.warn('Unparseable SSE event from DM model endpoint', { rawEvent });
      return null;
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** Aproximación burda: ~4 caracteres por token. */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
