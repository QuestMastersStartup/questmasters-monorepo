import { DmSession } from '../domain/entities/dm-session.entity';
import { DmTurn, DmTurnRole } from '../domain/entities/dm-turn.entity';
import type { DmSessionRepository } from '../domain/repositories/dm-session.repository';
import type { DmTurnRepository } from '../domain/repositories/dm-turn.repository';
import type {
  DmModelChunk,
  DmModelProvider,
  DmModelRequest,
} from '../domain/ports/dm-model.provider';
import { logger } from '../../shared/infrastructure/logger';

/**
 * Ejecuta un turno contra el proveedor de modelo en streaming y, cuando llega
 * la metadata final, persiste el DmTurn y actualiza la sesión (memoria, notas
 * y contadores). Re-emite cada chunk para que la ruta lo envíe por SSE.
 */
export async function* streamAndPersistTurn(params: {
  session: DmSession;
  role: DmTurnRole;
  request: DmModelRequest;
  provider: DmModelProvider;
  sessionRepo: DmSessionRepository;
  turnRepo: DmTurnRepository;
}): AsyncGenerator<DmModelChunk> {
  const { session, role, request, provider, sessionRepo, turnRepo } = params;

  let narrative = '';

  try {
    for await (const chunk of provider.generateTurn(request)) {
      if (chunk.type === 'delta' && chunk.delta) {
        narrative += chunk.delta;
      }

      if (chunk.type === 'metadata' && chunk.metadata) {
        const turn = DmTurn.create({
          sessionId: session.id.toString(),
          turnNumber: session.turnCount + 1,
          role,
          playerInput: request.playerInput,
          dmResponse: narrative,
          memorySnapshotAfter: chunk.metadata.memorySnapshot,
          narrativeNotesDelta: chunk.metadata.narrativeNotesDelta,
          inputTokens: chunk.metadata.usage.inputTokens,
          outputTokens: chunk.metadata.usage.outputTokens,
          latencyMs: chunk.metadata.latencyMs,
          modelId: chunk.metadata.modelId,
          architectureType: session.architectureType,
        });
        await turnRepo.save(turn);

        const updatedSession = session.applyTurn({
          memorySnapshot: chunk.metadata.memorySnapshot,
          narrativeNotesDelta: chunk.metadata.narrativeNotesDelta,
          inputTokens: chunk.metadata.usage.inputTokens,
          outputTokens: chunk.metadata.usage.outputTokens,
          latencyMs: chunk.metadata.latencyMs,
        });
        await sessionRepo.save(updatedSession);
      }

      yield chunk;

      if (chunk.type === 'done' || chunk.type === 'error') return;
    }
  } catch (e) {
    logger.error('DM turn streaming failed', {
      sessionId: session.id.toString(),
      error: String(e),
    });
    yield { type: 'error', error: 'Turn generation failed' };
  }
}
