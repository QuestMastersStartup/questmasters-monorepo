import type { ArchitectureType } from '../../domain/entities/dm-session.entity';
import { DmTurn, DmTurnRole } from '../../domain/entities/dm-turn.entity';
import { DmTurnOrmEntity } from '../typeorm/dm-turn.typeorm-entity';

export class DmTurnMapper {
  static toDomain(entity: DmTurnOrmEntity): DmTurn {
    return DmTurn.reconstruct({
      id: entity.id,
      sessionId: entity.sessionId,
      turnNumber: entity.turnNumber,
      role: entity.role as DmTurnRole,
      playerInput: entity.playerInput,
      dmResponse: entity.dmResponse,
      memorySnapshotAfter: entity.memorySnapshotAfter ?? {},
      narrativeNotesDelta: entity.narrativeNotesDelta ?? [],
      inputTokens: entity.inputTokens,
      outputTokens: entity.outputTokens,
      latencyMs: entity.latencyMs,
      modelId: entity.modelId,
      architectureType: entity.architectureType as ArchitectureType,
      createdAt: entity.createdAt,
    });
  }

  static toPersistence(domain: DmTurn): DmTurnOrmEntity {
    const entity = new DmTurnOrmEntity();
    entity.id = domain.id.toString();
    entity.sessionId = domain.sessionId.toString();
    entity.turnNumber = domain.turnNumber;
    entity.role = domain.role;
    entity.playerInput = domain.playerInput;
    entity.dmResponse = domain.dmResponse;
    entity.memorySnapshotAfter = domain.memorySnapshotAfter;
    entity.narrativeNotesDelta = domain.narrativeNotesDelta;
    entity.inputTokens = domain.inputTokens;
    entity.outputTokens = domain.outputTokens;
    entity.latencyMs = domain.latencyMs;
    entity.modelId = domain.modelId;
    entity.architectureType = domain.architectureType;
    entity.createdAt = domain.createdAt;
    return entity;
  }

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
