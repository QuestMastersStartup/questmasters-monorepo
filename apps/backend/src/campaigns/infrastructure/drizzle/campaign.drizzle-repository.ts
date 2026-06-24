import { eq, and, type SQL } from 'drizzle-orm';
import type { AppDb } from '../../../infrastructure/db/connection';
import { campaigns, campaignInstalledPacks } from '../../../infrastructure/db/schema';
import { Campaign } from '../../domain/entities/campaign.entity';
import type {
  CampaignRepository,
  CampaignFilters,
} from '../../domain/repositories/campaign.repository';
import type { UUID } from '@shared/domain/value-objects/uuid.vo';

type CampaignRow = typeof campaigns.$inferSelect;
type InstalledPackRow = typeof campaignInstalledPacks.$inferSelect;

function toDomain(row: CampaignRow, packs: InstalledPackRow[]): Campaign {
  return Campaign.reconstruct({
    id: row.id,
    name: row.name,
    description: row.description,
    system: row.system,
    coverImageUrl: row.coverImageUrl,
    dmId: row.dmId,
    status: row.status,
    installedPackIds: packs.map((p) => p.packId),
    createdAt: row.createdAt as unknown as Date,
    updatedAt: row.updatedAt as unknown as Date,
  });
}

export class CampaignDrizzleRepository implements CampaignRepository {
  constructor(private readonly db: AppDb) {}

  async save(campaign: Campaign): Promise<void> {
    const data = {
      id: campaign.id.toString(),
      name: campaign.name,
      description: campaign.description,
      system: campaign.system.toString(),
      coverImageUrl: campaign.coverImageUrl,
      dmId: campaign.dmId,
      status: campaign.status.toString(),
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    };
    const packRows = campaign.installedPackIds.map((packId) => ({
      campaignId: campaign.id.toString(),
      packId: packId.toString(),
    }));

    const stmts: any[] = [
      this.db
        .insert(campaigns)
        .values(data)
        .onConflictDoUpdate({ target: campaigns.id, set: data }),
      this.db
        .delete(campaignInstalledPacks)
        .where(eq(campaignInstalledPacks.campaignId, data.id)),
    ];
    if (packRows.length > 0) {
      stmts.push(this.db.insert(campaignInstalledPacks).values(packRows));
    }
    await (this.db as any).batch(stmts);
  }

  async findById(id: UUID): Promise<Campaign | null> {
    const campaignRow = await this.db.query.campaigns.findFirst({
      where: eq(campaigns.id, id.toString()),
    });
    if (!campaignRow) return null;

    const packs = await this.db
      .select()
      .from(campaignInstalledPacks)
      .where(eq(campaignInstalledPacks.campaignId, id.toString()));

    return toDomain(campaignRow, packs);
  }

  async findAll(filters?: CampaignFilters): Promise<Campaign[]> {
    const conditions: SQL[] = [];
    if (filters?.dmId) conditions.push(eq(campaigns.dmId, filters.dmId));
    if (filters?.status) conditions.push(eq(campaigns.status, filters.status));
    if (filters?.system) conditions.push(eq(campaigns.system, filters.system));

    const campaignRows = await this.db
      .select()
      .from(campaigns)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(campaigns.createdAt);

    if (campaignRows.length === 0) return [];

    const campaignIds = campaignRows.map((c) => c.id);
    const allPacks = await this.db
      .select()
      .from(campaignInstalledPacks)
      .where(
        campaignIds.length === 1
          ? eq(campaignInstalledPacks.campaignId, campaignIds[0])
          : undefined,
      );

    const packsByCampaign = new Map<string, InstalledPackRow[]>();
    for (const pack of allPacks) {
      if (!packsByCampaign.has(pack.campaignId)) {
        packsByCampaign.set(pack.campaignId, []);
      }
      packsByCampaign.get(pack.campaignId)!.push(pack);
    }

    return campaignRows.map((c) => toDomain(c, packsByCampaign.get(c.id) ?? []));
  }

  async delete(id: UUID): Promise<void> {
    await this.db.delete(campaigns).where(eq(campaigns.id, id.toString()));
  }

  async exists(id: UUID): Promise<boolean> {
    const row = await this.db.query.campaigns.findFirst({
      where: eq(campaigns.id, id.toString()),
      columns: { id: true },
    });
    return row !== undefined;
  }
}
