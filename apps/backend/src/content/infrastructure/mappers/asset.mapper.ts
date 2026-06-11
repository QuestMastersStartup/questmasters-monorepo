import { Asset } from '@content/domain/entities/asset.entity';

export class AssetMapper {
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
