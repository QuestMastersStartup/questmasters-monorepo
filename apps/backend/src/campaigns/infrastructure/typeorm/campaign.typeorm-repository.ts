import { Repository } from 'typeorm';
import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { Campaign } from '../../domain/entities/campaign.entity';
import { CampaignRepository, CampaignFilters } from '../../domain/repositories/campaign.repository';
import { CampaignOrmEntity } from './campaign.typeorm-entity';
import { CampaignMapper } from '../mappers/campaign.mapper';

export class CampaignTypeormRepository implements CampaignRepository {
  constructor(private readonly repository: Repository<CampaignOrmEntity>) {}

  async save(campaign: Campaign): Promise<void> {
    const entity = CampaignMapper.toPersistence(campaign);
    await this.repository.save(entity);
  }

  async findById(id: UUID): Promise<Campaign | null> {
    const entity = await this.repository.findOne({
      where: { id: id.toString() },
      relations: ['installedPacks'],
    });
    return entity ? CampaignMapper.toDomain(entity) : null;
  }

  async findAll(filters?: CampaignFilters): Promise<Campaign[]> {
    const queryBuilder = this.repository.createQueryBuilder('campaign');
    
    // Always join installed packs
    queryBuilder.leftJoinAndSelect('campaign.installedPacks', 'installedPacks');

    if (filters?.dmId) {
      queryBuilder.andWhere('campaign.dmId = :dmId', { dmId: filters.dmId });
    }

    if (filters?.status) {
      queryBuilder.andWhere('campaign.status = :status', { status: filters.status });
    }

    if (filters?.system) {
      queryBuilder.andWhere('campaign.system = :system', { system: filters.system });
    }

    queryBuilder.orderBy('campaign.createdAt', 'DESC');

    const entities = await queryBuilder.getMany();
    return entities.map(CampaignMapper.toDomain);
  }

  async delete(id: UUID): Promise<void> {
    await this.repository.delete({ id: id.toString() });
  }

  async exists(id: UUID): Promise<boolean> {
    const count = await this.repository.count({
      where: { id: id.toString() },
    });
    return count > 0;
  }
}
