import { Campaign } from '../../domain/entities/campaign.entity';

export class CampaignMapper {
  static toResponse(domain: Campaign) {
    return {
      id: domain.id.toString(),
      name: domain.name,
      description: domain.description,
      system: domain.system.toString(),
      coverImageUrl: domain.coverImageUrl,
      dmId: domain.dmId,
      status: domain.status.toString(),
      installedPackIds: domain.installedPackIds.map((id) => id.toString()),
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }
}
