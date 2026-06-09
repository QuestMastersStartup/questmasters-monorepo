import { Repository, Not } from 'typeorm';
import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { Character } from '../../domain/entities/character.entity';
import { CharacterRepository } from '../../domain/repositories/character.repository';
import { CharacterOrmEntity } from './character.typeorm-entity';
import { CharacterMapper } from '../mappers/character.mapper';

export class CharacterTypeormRepository implements CharacterRepository {
  constructor(private readonly repository: Repository<CharacterOrmEntity>) {}

  async save(character: Character): Promise<void> {
    const entity = CharacterMapper.toPersistence(character);
    await this.repository.save(entity);
  }

  async findById(id: UUID): Promise<Character | null> {
    const entity = await this.repository.findOne({
      where: { id: id.toString(), status: Not('deleted') },
    });
    return entity ? CharacterMapper.toDomain(entity) : null;
  }

  async findByCampaignId(campaignId: UUID): Promise<Character[]> {
    const entities = await this.repository.find({
      where: { campaignId: campaignId.toString(), status: Not('deleted') },
      order: { createdAt: 'ASC' },
    });
    return entities.map(CharacterMapper.toDomain);
  }

  async findByUserId(userId: string): Promise<Character[]> {
    const entities = await this.repository.find({
      where: { userId, status: Not('deleted') },
      order: { updatedAt: 'DESC' },
    });
    return entities.map(CharacterMapper.toDomain);
  }

  async findByUserAndCampaign(userId: string, campaignId: UUID): Promise<Character[]> {
    const entities = await this.repository.find({
      where: {
        userId,
        campaignId: campaignId.toString(),
        status: Not('deleted'),
      },
      order: { createdAt: 'ASC' },
    });
    return entities.map(CharacterMapper.toDomain);
  }

  async findActiveByUserAndCampaign(userId: string, campaignId: UUID): Promise<Character | null> {
    const entity = await this.repository.findOne({
      where: {
        userId,
        campaignId: campaignId.toString(),
        status: 'active',
      },
    });
    return entity ? CharacterMapper.toDomain(entity) : null;
  }

  async delete(id: UUID): Promise<void> {
    await this.repository.update({ id: id.toString() }, { status: 'deleted' });
  }
}
