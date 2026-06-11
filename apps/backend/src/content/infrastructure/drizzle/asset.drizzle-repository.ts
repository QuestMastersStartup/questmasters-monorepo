import { eq, and, inArray, like, type SQL } from 'drizzle-orm';
import type { AppDb } from '../../../infrastructure/db/connection';
import { assets } from '../../../infrastructure/db/schema';
import { Asset } from '../../domain/entities/asset.entity';
import type {
  AssetRepository,
  AssetFilters,
} from '../../domain/repositories/asset.repository';
import type { UUID } from '@shared/domain/value-objects/uuid.vo';
import type { AssetType } from '../../domain/value-objects/asset-type.vo';

type Row = typeof assets.$inferSelect;

function toDomain(row: Row): Asset {
  return Asset.reconstruct({
    id: row.id,
    packId: row.packId,
    type: row.type,
    index: row.index,
    name: row.name,
    data: row.data as Record<string, unknown>,
    compatibleWith: (row.compatibleWith as string[]) ?? [],
    createdAt: row.createdAt as unknown as Date,
    updatedAt: row.updatedAt as unknown as Date,
  });
}

export class AssetDrizzleRepository implements AssetRepository {
  constructor(private readonly db: AppDb) {}

  async save(asset: Asset): Promise<void> {
    const data = {
      id: asset.id.toString(),
      packId: asset.packId.toString(),
      type: asset.type.toString(),
      index: asset.index,
      name: asset.name,
      data: asset.data.toObject(),
      compatibleWith: asset.compatibleWith.map((c) => c.toString()),
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    };
    await this.db
      .insert(assets)
      .values(data)
      .onConflictDoUpdate({ target: assets.id, set: data });
  }

  async findById(id: UUID): Promise<Asset | null> {
    const row = await this.db.query.assets.findFirst({
      where: eq(assets.id, id.toString()),
    });
    return row ? toDomain(row) : null;
  }

  async findByPackAndTypeAndIndex(
    packId: UUID,
    type: AssetType,
    index: string,
  ): Promise<Asset | null> {
    const row = await this.db.query.assets.findFirst({
      where: and(
        eq(assets.packId, packId.toString()),
        eq(assets.type, type.toString()),
        eq(assets.index, index),
      ),
    });
    return row ? toDomain(row) : null;
  }

  async findAllByPack(packId: UUID, filters?: AssetFilters): Promise<Asset[]> {
    const conditions = [eq(assets.packId, packId.toString())];
    if (filters?.type) conditions.push(eq(assets.type, filters.type));

    const rows = await this.db
      .select()
      .from(assets)
      .where(and(...conditions))
      .orderBy(assets.name);
    return rows.map(toDomain);
  }

  async findAllByType(packId: UUID, type: AssetType): Promise<Asset[]> {
    const rows = await this.db
      .select()
      .from(assets)
      .where(and(eq(assets.packId, packId.toString()), eq(assets.type, type.toString())))
      .orderBy(assets.name);
    return rows.map(toDomain);
  }

  async delete(id: UUID): Promise<void> {
    await this.db.delete(assets).where(eq(assets.id, id.toString()));
  }

  async deleteAllByPack(packId: UUID): Promise<void> {
    await this.db.delete(assets).where(eq(assets.packId, packId.toString()));
  }

  async existsByPackAndTypeAndIndex(
    packId: UUID,
    type: AssetType,
    index: string,
  ): Promise<boolean> {
    const row = await this.db.query.assets.findFirst({
      where: and(
        eq(assets.packId, packId.toString()),
        eq(assets.type, type.toString()),
        eq(assets.index, index),
      ),
      columns: { id: true },
    });
    return row !== undefined;
  }

  async findByIds(ids: UUID[]): Promise<Asset[]> {
    if (ids.length === 0) return [];
    const rows = await this.db
      .select()
      .from(assets)
      .where(inArray(assets.id, ids.map((id) => id.toString())));
    return rows.map(toDomain);
  }

  async search(filters: {
    type?: string;
    name?: string;
    packIds?: string[];
  }): Promise<Asset[]> {
    const conditions: SQL[] = [];
    if (filters.type) conditions.push(eq(assets.type, filters.type));
    if (filters.name) conditions.push(like(assets.name, `%${filters.name}%`));
    if (filters.packIds && filters.packIds.length > 0)
      conditions.push(inArray(assets.packId, filters.packIds));

    const rows = await this.db
      .select()
      .from(assets)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(assets.name)
      .limit(500);
    return rows.map(toDomain);
  }
}
