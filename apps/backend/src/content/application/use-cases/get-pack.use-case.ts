import { Result } from '@shared/application/result';
import { Slug } from '@shared/domain/value-objects/slug.vo';
import { ContentPack } from '../../domain/entities/content-pack.entity';
import {
  ContentPackRepository,
  CONTENT_PACK_REPOSITORY,
} from '../../domain/repositories/content-pack.repository';
import { PackError } from '../errors';

import { Asset } from '../../domain/entities/asset.entity';
import {
  AssetRepository,
  ASSET_REPOSITORY,
} from '../../domain/repositories/asset.repository';

export class GetPackUseCase {
  constructor(
    private readonly packRepository: ContentPackRepository,
    private readonly assetRepository: AssetRepository,
  ) {}

  async execute(
    slug: string,
  ): Promise<Result<{ pack: ContentPack; assets: Asset[] }, PackError>> {
    const pack = await this.packRepository.findBySlug(Slug.fromString(slug));

    if (!pack) {
      return Result.fail(PackError.NOT_FOUND);
    }

    const assets = await this.assetRepository.findAllByPack(pack.id);

    return Result.ok({ pack, assets });
  }
}
