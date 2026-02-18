import { Injectable, Inject } from '@nestjs/common';
import { Result } from '@shared/application/result';
import { Slug } from '@shared/domain/value-objects/slug.vo';
import { Asset } from '../../domain/entities/asset.entity';
import {
  AssetRepository,
  AssetFilters,
  ASSET_REPOSITORY,
} from '../../domain/repositories/asset.repository';
import {
  ContentPackRepository,
  CONTENT_PACK_REPOSITORY,
} from '../../domain/repositories/content-pack.repository';
import { AssetError } from '../errors';

@Injectable()
export class ListAssetsUseCase {
  constructor(
    @Inject(ASSET_REPOSITORY)
    private readonly assetRepository: AssetRepository,
    @Inject(CONTENT_PACK_REPOSITORY)
    private readonly packRepository: ContentPackRepository,
  ) {}

  async execute(
    packSlug: string,
    filters?: AssetFilters,
  ): Promise<Result<Asset[], AssetError>> {
    const pack = await this.packRepository.findBySlug(
      Slug.fromString(packSlug),
    );

    if (!pack) {
      return Result.fail(AssetError.PACK_NOT_FOUND);
    }

    const assets = await this.assetRepository.findAllByPack(pack.id, filters);
    return Result.ok(assets);
  }
}
