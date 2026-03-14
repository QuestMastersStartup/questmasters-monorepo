import { Result } from '@shared/application/result';
import { Slug } from '@shared/domain/value-objects/slug.vo';
import { Asset } from '@content/domain/entities/asset.entity';
import { AssetData } from '@content/domain/value-objects/asset-data.vo';
import {
  AssetRepository,
  ASSET_REPOSITORY,
} from '@content/domain/repositories/asset.repository';
import {
  ContentPackRepository,
  CONTENT_PACK_REPOSITORY,
} from '@content/domain/repositories/content-pack.repository';
import { AssetError } from '@content/application/errors';
import { AssetType } from '@content/domain/value-objects/asset-type.vo';
import { UUID } from '@shared/domain/value-objects/uuid.vo';

export class UpdateAssetUseCase {
  constructor(
    private readonly assetRepository: AssetRepository,
    private readonly packRepository: ContentPackRepository,
  ) {}

  async execute(
    packSlug: string,
    type: string,
    index: string,
    dto: any,
  ): Promise<Result<Asset, AssetError>> {
    const pack = await this.packRepository.findBySlug(
      Slug.fromString(packSlug),
    );

    if (!pack) {
      return Result.fail(AssetError.PACK_NOT_FOUND);
    }

    if (!AssetType.isValid(type)) {
      return Result.fail(AssetError.INVALID_TYPE);
    }

    const asset = await this.assetRepository.findByPackAndTypeAndIndex(
      pack.id,
      AssetType.create(type),
      index,
    );

    if (!asset) {
      return Result.fail(AssetError.NOT_FOUND);
    }

    const compatibleWith = dto.compatibleWith
      ? dto.compatibleWith.map((id: string) => UUID.fromString(id))
      : undefined;

    const data = dto.data ? AssetData.create(dto.data) : undefined;

    const name = dto.data ? (dto.data as any).name : undefined;
    const updatedAsset = asset.update({
      name: name,
      data: data,
      compatibleWith: compatibleWith,
    });

    await this.assetRepository.save(updatedAsset);
    return Result.ok(updatedAsset);
  }
}
