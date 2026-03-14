import { Repository } from 'typeorm';
import { ContentPack } from '@content/domain/entities/content-pack.entity';
import {
  ContentPackRepository,
  ContentPackFilters,
} from '@content/domain/repositories/content-pack.repository';
import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { Slug } from '@shared/domain/value-objects/slug.vo';
import { ContentPackOrmEntity } from './content-pack.typeorm-entity';
import { ContentPackMapper } from '../mappers/content-pack.mapper';

export class ContentPackTypeormRepository implements ContentPackRepository {
  constructor(private readonly repository: Repository<ContentPackOrmEntity>) {}

  async save(pack: ContentPack): Promise<void> {
    const entity = ContentPackMapper.toPersistence(pack);
    await this.repository.save(entity);
  }

  async findBySlug(slug: Slug): Promise<ContentPack | null> {
    const entity = await this.repository.findOne({
      where: { slug: slug.toString() },
    });
    return entity ? ContentPackMapper.toDomain(entity) : null;
  }

  async findById(id: UUID): Promise<ContentPack | null> {
    const entity = await this.repository.findOne({
      where: { id: id.toString() },
    });
    return entity ? ContentPackMapper.toDomain(entity) : null;
  }

  async findAll(filters?: ContentPackFilters): Promise<ContentPack[]> {
    const queryBuilder = this.repository.createQueryBuilder('pack');

    if (filters?.isActive !== undefined) {
      queryBuilder.andWhere('pack.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    if (filters?.isSuspended !== undefined) {
      queryBuilder.andWhere('pack.isSuspended = :isSuspended', {
        isSuspended: filters.isSuspended,
      });
    }

    if (filters?.type) {
      queryBuilder.andWhere('pack.type = :type', { type: filters.type });
    }

    if (filters?.creatorId) {
      queryBuilder.andWhere('pack.creatorId = :creatorId', {
        creatorId: filters.creatorId,
      });
    }

    if (filters?.status) {
      queryBuilder.andWhere('pack.status = :status', {
        status: filters.status,
      });
    }

    queryBuilder.orderBy('pack.name', 'ASC');

    const entities = await queryBuilder.getMany();
    return entities.map(ContentPackMapper.toDomain);
  }

  async delete(id: UUID): Promise<void> {
    await this.repository.delete({ id: id.toString() });
  }

  async existsBySlug(slug: Slug): Promise<boolean> {
    const count = await this.repository.count({
      where: { slug: slug.toString() },
    });
    return count > 0;
  }
}
