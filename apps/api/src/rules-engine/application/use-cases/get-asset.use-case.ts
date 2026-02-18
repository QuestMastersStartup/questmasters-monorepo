import { Injectable, Inject } from '@nestjs/common';
import { Result } from '@shared/application/result';
import { Slug } from '@shared/domain/value-objects/slug.vo';
import { Asset } from '../../domain/entities/asset.entity';
import {
  AssetRepository,
  ASSET_REPOSITORY,
} from '../../domain/repositories/asset.repository';
import {
  ContentPackRepository,
  CONTENT_PACK_REPOSITORY,
} from '../../domain/repositories/content-pack.repository';
import { AssetType } from '../../domain/value-objects/asset-type.vo';
import { AssetError } from '../errors';

@Injectable()
export class GetAssetUseCase {
  constructor(
    @Inject(ASSET_REPOSITORY)
    private readonly assetRepository: AssetRepository,
    @Inject(CONTENT_PACK_REPOSITORY)
    private readonly packRepository: ContentPackRepository,
  ) {}

  async execute(
    packSlug: string,
    type: string,
    index: string,
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

    return Result.ok(asset);
  }
}
