import { Repository } from 'typeorm';
import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { DmTurn } from '../../domain/entities/dm-turn.entity';
import { DmTurnRepository } from '../../domain/repositories/dm-turn.repository';
import { DmTurnOrmEntity } from './dm-turn.typeorm-entity';
import { DmTurnMapper } from '../mappers/dm-turn.mapper';

export class DmTurnTypeormRepository implements DmTurnRepository {
  constructor(private readonly repository: Repository<DmTurnOrmEntity>) {}

  async save(turn: DmTurn): Promise<void> {
    const entity = DmTurnMapper.toPersistence(turn);
    await this.repository.save(entity);
  }

  async findBySessionId(sessionId: UUID): Promise<DmTurn[]> {
    const entities = await this.repository.find({
      where: { sessionId: sessionId.toString() },
      order: { turnNumber: 'ASC' },
    });
    return entities.map(DmTurnMapper.toDomain);
  }
}
