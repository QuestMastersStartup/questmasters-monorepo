import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { Result } from '@shared/application/result';
import type {
  ArchitectureType,
  NarrativeNote,
} from '../../domain/entities/dm-session.entity';
import { DmTurn } from '../../domain/entities/dm-turn.entity';
import { DmSessionRepository } from '../../domain/repositories/dm-session.repository';
import { DmTurnRepository } from '../../domain/repositories/dm-turn.repository';
import { DmSessionError } from '../errors';

export interface GetSessionMetricsDto {
  sessionId: string;
  userId: string;
  isAdmin: boolean;
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

export class GetSessionMetricsUseCase {
  constructor(
    private readonly sessionRepo: DmSessionRepository,
    private readonly turnRepo: DmTurnRepository,
  ) {}

  async execute(dto: GetSessionMetricsDto): Promise<Result<SessionMetrics, DmSessionError>> {
    // Solo administradores pueden consultar métricas (laboratorio de investigación)
    if (!dto.isAdmin) return Result.fail(DmSessionError.UNAUTHORIZED);

    const session = await this.sessionRepo.findById(UUID.fromString(dto.sessionId));
    if (!session) return Result.fail(DmSessionError.NOT_FOUND);

    const turns = await this.turnRepo.findBySessionId(session.id);

    return Result.ok({
      totalInputTokens: session.totalInputTokens,
      totalOutputTokens: session.totalOutputTokens,
      totalLatencyMs: session.totalLatencyMs,
      turnCount: session.turnCount,
      avgLatencyMs: session.turnCount > 0
        ? Math.round(session.totalLatencyMs / session.turnCount)
        : 0,
      architectureType: session.architectureType,
      modelId: session.modelId,
      narrativeNotes: session.narrativeNotes,
      memorySnapshot: session.memorySnapshot,
      turnBreakdown: turns,
    });
  }
}
