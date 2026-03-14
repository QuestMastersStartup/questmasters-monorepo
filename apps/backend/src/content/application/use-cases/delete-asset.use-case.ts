import { Result } from '@shared/application/result';
import { Slug } from '@shared/domain/value-objects/slug.vo';
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

export class DeleteAssetUseCase {
  constructor(
    private readonly assetRepository: AssetRepository,
    private readonly packRepository: ContentPackRepository,
  ) {}

  async execute(
    packSlug: string,
    type: string,
    index: string,
  ): Promise<Result<void, AssetError>> {
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

    await this.assetRepository.delete(asset.id);
    return Result.ok(void 0);
  }
}
