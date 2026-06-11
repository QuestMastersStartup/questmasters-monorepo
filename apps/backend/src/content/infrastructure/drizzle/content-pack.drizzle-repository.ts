import { eq, and, type SQL } from 'drizzle-orm';
import type { AppDb } from '../../../infrastructure/db/connection';
import { contentPacks } from '../../../infrastructure/db/schema';
import { ContentPack } from '../../domain/entities/content-pack.entity';
import type {
  ContentPackRepository,
  ContentPackFilters,
} from '../../domain/repositories/content-pack.repository';
import type { UUID } from '@shared/domain/value-objects/uuid.vo';
import type { Slug } from '@shared/domain/value-objects/slug.vo';

type Row = typeof contentPacks.$inferSelect;

function toDomain(row: Row): ContentPack {
  return ContentPack.reconstruct({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? '',
    version: row.version,
    type: row.type,
    system: row.system,
    creatorId: row.creatorId ?? '',
    dependencies: (row.dependencies as string[]) ?? [],
    isActive: row.isActive,
    isSuspended: row.isSuspended,
    suspensionReason: row.suspensionReason,
    status: row.status,
    createdAt: row.createdAt as unknown as Date,
    updatedAt: row.updatedAt as unknown as Date,
  });
}

export class ContentPackDrizzleRepository implements ContentPackRepository {
  constructor(private readonly db: AppDb) {}

  async save(pack: ContentPack): Promise<void> {
    const data = {
      id: pack.id.toString(),
      slug: pack.slug.toString(),
      name: pack.name,
      description: pack.description,
      version: pack.version,
      type: pack.type.toString(),
      system: pack.system.toString(),
      creatorId: pack.creatorId.toString(),
      dependencies: pack.dependencies.map((d) => d.toString()),
      isActive: pack.isActive,
      isSuspended: pack.isSuspended,
      suspensionReason: pack.suspensionReason,
      status: pack.status.toString(),
      createdAt: pack.createdAt,
      updatedAt: pack.updatedAt,
    };
    await this.db
      .insert(contentPacks)
      .values(data)
      .onConflictDoUpdate({ target: contentPacks.id, set: data });
  }

  async findById(id: UUID): Promise<ContentPack | null> {
    const row = await this.db.query.contentPacks.findFirst({
      where: eq(contentPacks.id, id.toString()),
    });
    return row ? toDomain(row) : null;
  }

  async findBySlug(slug: Slug): Promise<ContentPack | null> {
    const row = await this.db.query.contentPacks.findFirst({
      where: eq(contentPacks.slug, slug.toString()),
    });
    return row ? toDomain(row) : null;
  }

  async findAll(filters?: ContentPackFilters): Promise<ContentPack[]> {
    const conditions: SQL[] = [];
    if (filters?.isActive !== undefined)
      conditions.push(eq(contentPacks.isActive, filters.isActive));
    if (filters?.isSuspended !== undefined)
      conditions.push(eq(contentPacks.isSuspended, filters.isSuspended));
    if (filters?.type)
      conditions.push(eq(contentPacks.type, filters.type));
    if (filters?.creatorId)
      conditions.push(eq(contentPacks.creatorId, filters.creatorId));
    if (filters?.status)
      conditions.push(eq(contentPacks.status, filters.status));

    const rows = await this.db
      .select()
      .from(contentPacks)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(contentPacks.name);
    return rows.map(toDomain);
  }

  async delete(id: UUID): Promise<void> {
    await this.db.delete(contentPacks).where(eq(contentPacks.id, id.toString()));
  }

  async existsBySlug(slug: Slug): Promise<boolean> {
    const row = await this.db.query.contentPacks.findFirst({
      where: eq(contentPacks.slug, slug.toString()),
      columns: { id: true },
    });
    return row !== undefined;
  }
}
