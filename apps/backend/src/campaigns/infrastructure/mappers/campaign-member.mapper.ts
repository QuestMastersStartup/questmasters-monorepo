import { CampaignMember } from '../../domain/entities/campaign-member.entity';
import { CampaignMemberOrmEntity } from '../typeorm/campaign-member.typeorm-entity';
import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { UserProfileMapper } from '../../../users/infrastructure/mappers/user-profile.mapper';

export class CampaignMemberMapper {
  static toDomain(entity: CampaignMemberOrmEntity): CampaignMember {
    return CampaignMember.reconstruct({
      id: UUID.fromString(entity.id),
      campaignId: UUID.fromString(entity.campaignId),
      userId: entity.userId,
      role: entity.role,
      joinedAt: entity.joinedAt,
      user: entity.user ? UserProfileMapper.toDomain(entity.user) : undefined,
    });
  }

  static toPersistence(domain: CampaignMember): CampaignMemberOrmEntity {
    const entity = new CampaignMemberOrmEntity();
    entity.id = domain.id.toString();
    entity.campaignId = domain.campaignId.toString();
    entity.userId = domain.userId;
    entity.role = domain.role;
    entity.joinedAt = domain.joinedAt;
    return entity;
  }

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
