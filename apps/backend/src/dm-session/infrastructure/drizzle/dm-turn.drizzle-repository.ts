import { eq, asc } from 'drizzle-orm';
import type { AppDb } from '../../../infrastructure/db/connection';
import { dmTurns } from '../../../infrastructure/db/schema';
import { DmTurn, type DmTurnRole } from '../../domain/entities/dm-turn.entity';
import type { DmTurnRepository } from '../../domain/repositories/dm-turn.repository';
import type { UUID } from '@shared/domain/value-objects/uuid.vo';
import type { ArchitectureType, NarrativeNote } from '../../domain/entities/dm-session.entity';

type Row = typeof dmTurns.$inferSelect;

function toDomain(row: Row): DmTurn {
  return DmTurn.reconstruct({
    id: row.id,
    sessionId: row.sessionId,
    turnNumber: row.turnNumber,
    role: row.role as DmTurnRole,
    playerInput: row.playerInput,
    dmResponse: row.dmResponse,
    memorySnapshotAfter: (row.memorySnapshotAfter as Record<string, unknown>) ?? {},
    narrativeNotesDelta: (row.narrativeNotesDelta as NarrativeNote[]) ?? [],
    inputTokens: row.inputTokens,
    outputTokens: row.outputTokens,
    latencyMs: row.latencyMs,
    modelId: row.modelId,
    architectureType: row.architectureType as ArchitectureType,
    createdAt: row.createdAt as unknown as Date,
  });
}

export class DmTurnDrizzleRepository implements DmTurnRepository {
  constructor(private readonly db: AppDb) {}

  async save(turn: DmTurn): Promise<void> {
    const data = {
      id: turn.id.toString(),
      sessionId: turn.sessionId.toString(),
      turnNumber: turn.turnNumber,
      role: turn.role,
      playerInput: turn.playerInput,
      dmResponse: turn.dmResponse,
      memorySnapshotAfter: turn.memorySnapshotAfter,
      narrativeNotesDelta: turn.narrativeNotesDelta,
      inputTokens: turn.inputTokens,
      outputTokens: turn.outputTokens,
      latencyMs: turn.latencyMs,
      modelId: turn.modelId,
      architectureType: turn.architectureType,
      createdAt: turn.createdAt,
    };
    await this.db
      .insert(dmTurns)
      .values(data)
      .onConflictDoUpdate({ target: dmTurns.id, set: data });
  }

  async findBySessionId(sessionId: UUID): Promise<DmTurn[]> {
    const rows = await this.db
      .select()
      .from(dmTurns)
      .where(eq(dmTurns.sessionId, sessionId.toString()))
      .orderBy(asc(dmTurns.turnNumber));
    return rows.map(toDomain);
  }
}
