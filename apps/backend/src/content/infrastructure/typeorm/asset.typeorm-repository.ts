import { Repository } from 'typeorm';
import { Asset } from '@content/domain/entities/asset.entity';
import {
  AssetRepository,
  AssetFilters,
} from '@content/domain/repositories/asset.repository';
import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { AssetType } from '@content/domain/value-objects/asset-type.vo';
import { AssetOrmEntity } from './asset.typeorm-entity';
import { AssetMapper } from '../mappers/asset.mapper';

export class AssetTypeormRepository implements AssetRepository {
  constructor(private readonly repository: Repository<AssetOrmEntity>) {}

  async save(asset: Asset): Promise<void> {
    const entity = AssetMapper.toPersistence(asset);
    await this.repository.save(entity);
  }

  async findById(id: UUID): Promise<Asset | null> {
    const entity = await this.repository.findOne({
      where: { id: id.toString() },
    });
    return entity ? AssetMapper.toDomain(entity) : null;
  }

  async findByPackAndTypeAndIndex(
    packId: UUID,
    type: AssetType,
    index: string,
  ): Promise<Asset | null> {
    const entity = await this.repository.findOne({
      where: {
        packId: packId.toString(),
        type: type.toString(),
        index,
      },
    });
    return entity ? AssetMapper.toDomain(entity) : null;
  }

  async findAllByPack(packId: UUID, filters?: AssetFilters): Promise<Asset[]> {
    const queryBuilder = this.repository.createQueryBuilder('asset');
    queryBuilder.where('asset.packId = :packId', { packId: packId.toString() });

    if (filters?.type) {
      queryBuilder.andWhere('asset.type = :type', { type: filters.type });
    }

    queryBuilder.orderBy('asset.name', 'ASC');

    const entities = await queryBuilder.getMany();
    return entities.map(AssetMapper.toDomain);
  }

  async findAllByType(packId: UUID, type: AssetType): Promise<Asset[]> {
    const entities = await this.repository.find({
      where: {
        packId: packId.toString(),
        type: type.toString(),
      },
      order: { name: 'ASC' },
    });
    return entities.map(AssetMapper.toDomain);
  }

  async delete(id: UUID): Promise<void> {
    await this.repository.delete({ id: id.toString() });
  }

  async deleteAllByPack(packId: UUID): Promise<void> {
    await this.repository.delete({ packId: packId.toString() });
  }

  async existsByPackAndTypeAndIndex(
    packId: UUID,
    type: AssetType,
    index: string,
  ): Promise<boolean> {
    const count = await this.repository.count({
      where: {
        packId: packId.toString(),
        type: type.toString(),
        index,
      },
    });
    return count > 0;
  }
}
