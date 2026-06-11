import { DmTurn } from '../../domain/entities/dm-turn.entity';

export class DmTurnMapper {
  static toResponse(domain: DmTurn) {
    return {
      id: domain.id.toString(),
      sessionId: domain.sessionId.toString(),
      turnNumber: domain.turnNumber,
      role: domain.role,
      playerInput: domain.playerInput,
      dmResponse: domain.dmResponse,
      memorySnapshotAfter: domain.memorySnapshotAfter,
      narrativeNotesDelta: domain.narrativeNotesDelta,
      inputTokens: domain.inputTokens,
      outputTokens: domain.outputTokens,
      latencyMs: domain.latencyMs,
      modelId: domain.modelId,
      architectureType: domain.architectureType,
      createdAt: domain.createdAt.toISOString(),
    };
  }
}
