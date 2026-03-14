import { Asset } from '@content/domain/entities/asset.entity';
import { AssetOrmEntity } from '../typeorm/asset.typeorm-entity';

export class AssetMapper {
  static toDomain(entity: AssetOrmEntity): Asset {
    return Asset.reconstruct({
      id: entity.id,
      packId: entity.packId,
      type: entity.type,
      index: entity.index,
      name: entity.name,
      data: entity.data,
      compatibleWith: entity.compatibleWith ?? [],
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toPersistence(domain: Asset): AssetOrmEntity {
    const entity = new AssetOrmEntity();
    entity.id = domain.id.toString();
    entity.packId = domain.packId.toString();
    entity.type = domain.type.toString();
    entity.index = domain.index;
    entity.name = domain.name;
    entity.data = domain.data.toObject();
    entity.compatibleWith = domain.compatibleWith.map((c) => c.toString());
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }

  static toResponse(domain: Asset) {
    return {
      id: domain.id.toString(),
      packId: domain.packId.toString(),
      type: domain.type.toString(),
      index: domain.index,
      name: domain.name,
      data: domain.data.toObject(),
      compatibleWith: domain.compatibleWith.map((c) => c.toString()),
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }
}
