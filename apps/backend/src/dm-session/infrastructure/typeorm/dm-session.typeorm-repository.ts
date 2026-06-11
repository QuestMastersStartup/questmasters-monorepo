import { Repository } from 'typeorm';
import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { DmSession } from '../../domain/entities/dm-session.entity';
import { DmSessionRepository } from '../../domain/repositories/dm-session.repository';
import { DmSessionOrmEntity } from './dm-session.typeorm-entity';
import { DmSessionMapper } from '../mappers/dm-session.mapper';

export class DmSessionTypeormRepository implements DmSessionRepository {
  constructor(private readonly repository: Repository<DmSessionOrmEntity>) {}

  async save(session: DmSession): Promise<void> {
    const entity = DmSessionMapper.toPersistence(session);
    await this.repository.save(entity);
  }

  async findById(id: UUID): Promise<DmSession | null> {
    const entity = await this.repository.findOne({
      where: { id: id.toString() },
    });
    return entity ? DmSessionMapper.toDomain(entity) : null;
  }

  async findByUserId(userId: string): Promise<DmSession[]> {
    const entities = await this.repository.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });
    return entities.map(DmSessionMapper.toDomain);
  }

  async findAll(): Promise<DmSession[]> {
    const entities = await this.repository.find({
      order: { updatedAt: 'DESC' },
    });
    return entities.map(DmSessionMapper.toDomain);
  }
}
