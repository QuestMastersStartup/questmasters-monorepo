import { eq, desc, and, isNull } from 'drizzle-orm';
import type { AppDb } from '../../../infrastructure/db/connection';
import { dmSessions } from '../../../infrastructure/db/schema';
import {
  DmSession,
  type ArchitectureType,
  type DmSessionStatus,
  type CharacterSnapshot,
  type NarrativeNote,
} from '../../domain/entities/dm-session.entity';
import type { DmSessionRepository } from '../../domain/repositories/dm-session.repository';
import type { UUID } from '@shared/domain/value-objects/uuid.vo';

type Row = typeof dmSessions.$inferSelect;

function toDomain(row: Row): DmSession {
  return DmSession.reconstruct({
    id: row.id,
    userId: row.userId,
    title: row.title,
    campaignPrompt: row.campaignPrompt,
    characters: (row.characters as CharacterSnapshot[]) ?? [],
    architectureType: row.architectureType as ArchitectureType,
    status: row.status as DmSessionStatus,
    modelId: row.modelId,
    memorySnapshot: (row.memorySnapshot as Record<string, unknown>) ?? {},
    narrativeNotes: (row.narrativeNotes as NarrativeNote[]) ?? [],
    turnCount: row.turnCount,
    totalInputTokens: row.totalInputTokens,
    totalOutputTokens: row.totalOutputTokens,
    totalLatencyMs: row.totalLatencyMs,
    createdAt: row.createdAt as unknown as Date,
    updatedAt: row.updatedAt as unknown as Date,
    deletedAt: row.deletedAt ? (row.deletedAt as unknown as Date) : null,
  });
}

export class DmSessionDrizzleRepository implements DmSessionRepository {
  constructor(private readonly db: AppDb) {}

  async save(session: DmSession): Promise<void> {
    const data = {
      id: session.id.toString(),
      userId: session.userId,
      title: session.title,
      campaignPrompt: session.campaignPrompt,
      characters: session.characters,
      architectureType: session.architectureType,
      status: session.status,
      modelId: session.modelId,
      memorySnapshot: session.memorySnapshot,
      narrativeNotes: session.narrativeNotes,
      turnCount: session.turnCount,
      totalInputTokens: session.totalInputTokens,
      totalOutputTokens: session.totalOutputTokens,
      totalLatencyMs: session.totalLatencyMs,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      deletedAt: session.deletedAt,
    };
    await this.db
      .insert(dmSessions)
      .values(data)
      .onConflictDoUpdate({ target: dmSessions.id, set: data });
  }

  async findById(id: UUID): Promise<DmSession | null> {
    const row = await this.db.query.dmSessions.findFirst({
      where: and(eq(dmSessions.id, id.toString()), isNull(dmSessions.deletedAt)),
    });
    return row ? toDomain(row) : null;
  }

  async findByUserId(userId: string): Promise<DmSession[]> {
    const rows = await this.db
      .select()
      .from(dmSessions)
      .where(and(eq(dmSessions.userId, userId), isNull(dmSessions.deletedAt)))
      .orderBy(desc(dmSessions.updatedAt));
    return rows.map(toDomain);
  }

  async findAll(): Promise<DmSession[]> {
    const rows = await this.db
      .select()
      .from(dmSessions)
      .where(isNull(dmSessions.deletedAt))
      .orderBy(desc(dmSessions.updatedAt));
    return rows.map(toDomain);
  }
}
