import { Campaign } from '../../domain/entities/campaign.entity';
import { CampaignOrmEntity } from '../typeorm/campaign.typeorm-entity';
import { CampaignInstalledPackOrmEntity } from '../typeorm/campaign-installed-pack.typeorm-entity';

export class CampaignMapper {
  static toDomain(entity: CampaignOrmEntity): Campaign {
    return Campaign.reconstruct({
      id: entity.id,
      name: entity.name,
      description: entity.description,
      system: entity.system,
      coverImageUrl: entity.coverImageUrl,
      dmId: entity.dmId,
      status: entity.status,
      installedPackIds: entity.installedPacks?.map((ip) => ip.packId) ?? [],
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toPersistence(domain: Campaign): CampaignOrmEntity {
    const entity = new CampaignOrmEntity();
    entity.id = domain.id.toString();
    entity.name = domain.name;
    entity.description = domain.description;
    entity.system = domain.system.toString();
    entity.coverImageUrl = domain.coverImageUrl;
    entity.dmId = domain.dmId;
    entity.status = domain.status.toString();
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;

    // Mapping relationship for saving (if using cascade)
    entity.installedPacks = domain.installedPackIds.map((packId) => {
      const cip = new CampaignInstalledPackOrmEntity();
      cip.campaignId = entity.id;
      cip.packId = packId.toString();
      return cip;
    });

    return entity;
  }

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
