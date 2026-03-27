import { Repository } from 'typeorm';
import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { CampaignMember } from '../../domain/entities/campaign-member.entity';
import { CampaignMemberRepository } from '../../domain/repositories/campaign-member.repository';
import { CampaignMemberOrmEntity } from './campaign-member.typeorm-entity';
import { CampaignMemberMapper } from '../mappers/campaign-member.mapper';

export class CampaignMemberTypeormRepository implements CampaignMemberRepository {
  constructor(private readonly repository: Repository<CampaignMemberOrmEntity>) {}

  async save(member: CampaignMember): Promise<void> {
    const entity = CampaignMemberMapper.toPersistence(member);
    await this.repository.save(entity);
  }

  async findById(id: UUID): Promise<CampaignMember | null> {
    const entity = await this.repository.findOne({ where: { id: id.toString() } });
    return entity ? CampaignMemberMapper.toDomain(entity) : null;
  }

  async findByCampaignId(campaignId: UUID): Promise<CampaignMember[]> {
    const entities = await this.repository.find({
      where: { campaignId: campaignId.toString() },
      order: { joinedAt: 'ASC' },
      relations: ['user'], // Useful to get profiles directly
    });
    return entities.map(CampaignMemberMapper.toDomain);
  }

  async findByUserAndCampaign(userId: string, campaignId: UUID): Promise<CampaignMember | null> {
    const entity = await this.repository.findOne({
      where: {
        userId,
        campaignId: campaignId.toString(),
      },
    });
    return entity ? CampaignMemberMapper.toDomain(entity) : null;
  }

  async delete(id: UUID): Promise<void> {
    await this.repository.delete({ id: id.toString() });
  }

  async countMembers(campaignId: UUID): Promise<number> {
    return this.repository.count({ where: { campaignId: campaignId.toString() } });
  }
}
