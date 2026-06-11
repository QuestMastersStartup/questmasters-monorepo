import { CampaignMember } from '../../domain/entities/campaign-member.entity';

export class CampaignMemberMapper {
  static toResponse(domain: CampaignMember) {
    return {
      id: domain.id.toString(),
      campaignId: domain.campaignId.toString(),
      userId: domain.userId,
      role: domain.role,
      joinedAt: domain.joinedAt.toISOString(),
      user: domain.user ? {
        username: domain.user.username,
        avatarUrl: domain.user.avatarUrl,
        bio: domain.user.bio,
      } : undefined,
    };
  }
}
