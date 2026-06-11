import {
  ArchitectureType,
  DmSession,
  DmSessionStatus,
} from '../../domain/entities/dm-session.entity';
import { DmSessionOrmEntity } from '../typeorm/dm-session.typeorm-entity';

export class DmSessionMapper {
  static toDomain(entity: DmSessionOrmEntity): DmSession {
    return DmSession.reconstruct({
      id: entity.id,
      userId: entity.userId,
      title: entity.title,
      campaignPrompt: entity.campaignPrompt,
      characters: entity.characters ?? [],
      architectureType: entity.architectureType as ArchitectureType,
      status: entity.status as DmSessionStatus,
      modelId: entity.modelId,
      memorySnapshot: entity.memorySnapshot ?? {},
      narrativeNotes: entity.narrativeNotes ?? [],
      turnCount: entity.turnCount,
      totalInputTokens: entity.totalInputTokens,
      totalOutputTokens: entity.totalOutputTokens,
      totalLatencyMs: entity.totalLatencyMs,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toPersistence(domain: DmSession): DmSessionOrmEntity {
    const entity = new DmSessionOrmEntity();
    entity.id = domain.id.toString();
    entity.userId = domain.userId;
    entity.title = domain.title;
    entity.campaignPrompt = domain.campaignPrompt;
    entity.characters = domain.characters;
    entity.architectureType = domain.architectureType;
    entity.status = domain.status;
    entity.modelId = domain.modelId;
    entity.memorySnapshot = domain.memorySnapshot;
    entity.narrativeNotes = domain.narrativeNotes;
    entity.turnCount = domain.turnCount;
    entity.totalInputTokens = domain.totalInputTokens;
    entity.totalOutputTokens = domain.totalOutputTokens;
    entity.totalLatencyMs = domain.totalLatencyMs;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }

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
