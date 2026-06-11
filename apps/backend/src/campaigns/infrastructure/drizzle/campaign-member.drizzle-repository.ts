import { eq, and, asc } from 'drizzle-orm';
import type { AppDb } from '../../../infrastructure/db/connection';
import { campaignMembers, userProfiles } from '../../../infrastructure/db/schema';
import { CampaignMember } from '../../domain/entities/campaign-member.entity';
import type { CampaignMemberRepository } from '../../domain/repositories/campaign-member.repository';
import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { UserProfile } from '../../../users/domain/entities/user-profile.entity';

type MemberRow = typeof campaignMembers.$inferSelect;
type UserRow = typeof userProfiles.$inferSelect;

function toDomain(row: MemberRow, userRow?: UserRow): CampaignMember {
  const user = userRow
    ? UserProfile.reconstruct({
        id: userRow.id,
        username: userRow.username,
        avatarUrl: userRow.avatarUrl,
        bio: userRow.bio,
        role: userRow.role as 'admin' | 'creator' | 'player',
        isAdmin: userRow.isAdmin,
        createdAt: userRow.createdAt as unknown as Date,
        updatedAt: userRow.updatedAt as unknown as Date,
      })
    : undefined;

  return CampaignMember.reconstruct({
    id: UUID.fromString(row.id),
    campaignId: UUID.fromString(row.campaignId),
    userId: row.userId,
    role: row.role as 'dm' | 'player',
    joinedAt: row.joinedAt as unknown as Date,
    user,
  });
}

export class CampaignMemberDrizzleRepository implements CampaignMemberRepository {
  constructor(private readonly db: AppDb) {}

  async save(member: CampaignMember): Promise<void> {
    const data = {
      id: member.id.toString(),
      campaignId: member.campaignId.toString(),
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt,
    };
    await this.db
      .insert(campaignMembers)
      .values(data)
      .onConflictDoUpdate({ target: campaignMembers.id, set: data });
  }

  async findById(id: UUID): Promise<CampaignMember | null> {
    const row = await this.db.query.campaignMembers.findFirst({
      where: eq(campaignMembers.id, id.toString()),
    });
    return row ? toDomain(row) : null;
  }

  async findByCampaignId(campaignId: UUID): Promise<CampaignMember[]> {
    const rows = await this.db
      .select({
        member: campaignMembers,
        user: userProfiles,
      })
      .from(campaignMembers)
      .leftJoin(userProfiles, eq(campaignMembers.userId, userProfiles.id))
      .where(eq(campaignMembers.campaignId, campaignId.toString()))
      .orderBy(asc(campaignMembers.joinedAt));

    return rows.map((r) => toDomain(r.member, r.user ?? undefined));
  }

  async findByUserAndCampaign(
    userId: string,
    campaignId: UUID,
  ): Promise<CampaignMember | null> {
    const row = await this.db.query.campaignMembers.findFirst({
      where: and(
        eq(campaignMembers.userId, userId),
        eq(campaignMembers.campaignId, campaignId.toString()),
      ),
    });
    return row ? toDomain(row) : null;
  }

  async delete(id: UUID): Promise<void> {
    await this.db
      .delete(campaignMembers)
      .where(eq(campaignMembers.id, id.toString()));
  }

  async countMembers(campaignId: UUID): Promise<number> {
    const rows = await this.db
      .select({ id: campaignMembers.id })
      .from(campaignMembers)
      .where(eq(campaignMembers.campaignId, campaignId.toString()));
    return rows.length;
  }
}
