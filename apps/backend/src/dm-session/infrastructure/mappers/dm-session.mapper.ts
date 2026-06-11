import { DmSession } from '../../domain/entities/dm-session.entity';

export class DmSessionMapper {
  static toResponse(domain: DmSession) {
    return {
      id: domain.id.toString(),
      userId: domain.userId,
      title: domain.title,
      campaignPrompt: domain.campaignPrompt,
      characters: domain.characters,
      architectureType: domain.architectureType,
      status: domain.status,
      modelId: domain.modelId,
      memorySnapshot: domain.memorySnapshot,
      narrativeNotes: domain.narrativeNotes,
      turnCount: domain.turnCount,
      totalInputTokens: domain.totalInputTokens,
      totalOutputTokens: domain.totalOutputTokens,
      totalLatencyMs: domain.totalLatencyMs,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }

  /** Versión ligera para listados (sin prompt, memoria ni notas). */
  static toSummaryResponse(domain: DmSession) {
    return {
      id: domain.id.toString(),
      userId: domain.userId,
      title: domain.title,
      architectureType: domain.architectureType,
      status: domain.status,
      modelId: domain.modelId,
      turnCount: domain.turnCount,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }
}
