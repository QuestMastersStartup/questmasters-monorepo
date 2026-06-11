import { eq, and, ne, desc, asc } from 'drizzle-orm';
import type { AppDb } from '../../../infrastructure/db/connection';
import { characters } from '../../../infrastructure/db/schema';
import { Character } from '../../domain/entities/character.entity';
import type { CharacterRepository } from '../../domain/repositories/character.repository';
import type { UUID } from '@shared/domain/value-objects/uuid.vo';
import type { AbilityScores } from '@questmasters/dnd-rules';

type Row = typeof characters.$inferSelect;

function toDomain(row: Row): Character {
  return Character.reconstruct({
    id: row.id,
    campaignId: row.campaignId,
    userId: row.userId,
    name: row.name,
    raceAssetId: row.raceAssetId,
    classAssetId: row.classAssetId,
    backgroundAssetId: row.backgroundAssetId,
    level: row.level,
    stats: row.stats as AbilityScores,
    hitPoints: row.hitPoints,
    portraitUrl: row.portraitUrl,
    backstory: row.backstory,
    status: row.status,
    choices: row.choices as Record<string, unknown> | null,
    createdAt: row.createdAt as unknown as Date,
    updatedAt: row.updatedAt as unknown as Date,
  });
}

export class CharacterDrizzleRepository implements CharacterRepository {
  constructor(private readonly db: AppDb) {}

  async save(character: Character): Promise<void> {
    const data = {
      id: character.id.toString(),
      campaignId: character.campaignId?.toString() ?? null,
      userId: character.userId,
      name: character.name,
      raceAssetId: character.raceAssetId?.toString() ?? null,
      classAssetId: character.classAssetId?.toString() ?? null,
      backgroundAssetId: character.backgroundAssetId?.toString() ?? null,
      level: character.level,
      stats: character.stats,
      hitPoints: character.hitPoints,
      portraitUrl: character.portraitUrl,
      backstory: character.backstory,
      status: character.status.toString(),
      choices: character.choices,
      createdAt: character.createdAt,
      updatedAt: character.updatedAt,
    };
    await this.db
      .insert(characters)
      .values(data)
      .onConflictDoUpdate({ target: characters.id, set: data });
  }

  async findById(id: UUID): Promise<Character | null> {
    const row = await this.db.query.characters.findFirst({
      where: and(eq(characters.id, id.toString()), ne(characters.status, 'deleted')),
    });
    return row ? toDomain(row) : null;
  }

  async findByCampaignId(campaignId: UUID): Promise<Character[]> {
    const rows = await this.db
      .select()
      .from(characters)
      .where(
        and(
          eq(characters.campaignId, campaignId.toString()),
          ne(characters.status, 'deleted'),
        ),
      )
      .orderBy(asc(characters.createdAt));
    return rows.map(toDomain);
  }

  async findByUserId(userId: string): Promise<Character[]> {
    const rows = await this.db
      .select()
      .from(characters)
      .where(and(eq(characters.userId, userId), ne(characters.status, 'deleted')))
      .orderBy(desc(characters.updatedAt));
    return rows.map(toDomain);
  }

  async findByUserAndCampaign(
    userId: string,
    campaignId: UUID,
  ): Promise<Character[]> {
    const rows = await this.db
      .select()
      .from(characters)
      .where(
        and(
          eq(characters.userId, userId),
          eq(characters.campaignId, campaignId.toString()),
          ne(characters.status, 'deleted'),
        ),
      )
      .orderBy(asc(characters.createdAt));
    return rows.map(toDomain);
  }

  async findActiveByUserAndCampaign(
    userId: string,
    campaignId: UUID,
  ): Promise<Character | null> {
    const row = await this.db.query.characters.findFirst({
      where: and(
        eq(characters.userId, userId),
        eq(characters.campaignId, campaignId.toString()),
        eq(characters.status, 'active'),
      ),
    });
    return row ? toDomain(row) : null;
  }

  async delete(id: UUID): Promise<void> {
    await this.db
      .update(characters)
      .set({ status: 'deleted', updatedAt: new Date() })
      .where(eq(characters.id, id.toString()));
  }
}
