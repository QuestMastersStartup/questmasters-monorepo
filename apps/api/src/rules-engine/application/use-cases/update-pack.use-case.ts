import { Injectable, Inject } from '@nestjs/common';
import { Result } from '@shared/application/result';
import { Slug } from '@shared/domain/value-objects/slug.vo';
import { ContentPack } from '@rules-engine/domain/entities/content-pack.entity';
import {
  ContentPackRepository,
  CONTENT_PACK_REPOSITORY,
} from '@rules-engine/domain/repositories/content-pack.repository';
import {
  AssetRepository,
  ASSET_REPOSITORY,
} from '@rules-engine/domain/repositories/asset.repository';
import { Asset } from '@rules-engine/domain/entities/asset.entity';
import { UpdatePackDto } from '@rules-engine/application/dto/pack.dto';
import { PackError } from '@rules-engine/application/errors';

import { CreateAssetUseCase } from './create-asset.use-case';
import { UpdateAssetUseCase } from './update-asset.use-case';
import { DeleteAssetUseCase } from './delete-asset.use-case';

@Injectable()
export class UpdatePackUseCase {
  constructor(
    @Inject(CONTENT_PACK_REPOSITORY)
    private readonly packRepository: ContentPackRepository,
    @Inject(ASSET_REPOSITORY)
    private readonly assetRepository: AssetRepository,
    private readonly createAssetUseCase: CreateAssetUseCase,
    private readonly updateAssetUseCase: UpdateAssetUseCase,
    private readonly deleteAssetUseCase: DeleteAssetUseCase,
  ) {}

  async execute(
    slug: string,
    dto: UpdatePackDto,
  ): Promise<Result<ContentPack, PackError>> {
    const pack = await this.packRepository.findBySlug(Slug.fromString(slug));

    if (!pack) {
      return Result.fail(PackError.NOT_FOUND);
    }

    // 1. Update Pack Metadata
    const updatedPack = pack.update({
      name: dto.name,
      description: dto.description,
      version: dto.version,
    });

    await this.packRepository.save(updatedPack);

    // 2. Synchronize Assets (if provided)
    if (dto.assets) {
      const existingAssets = await this.assetRepository.findAllByPack(pack.id);
      const existingAssetsMap = new Map<string, Asset>();

      existingAssets.forEach((asset) => {
        existingAssetsMap.set(`${asset.type.toString()}:${asset.index}`, asset);
      });

      for (const assetData of dto.assets) {
        // Safe mapping + fallback index logic (borrowed from CreatePackUseCase)
        const type = assetData.type;
        const index =
          assetData.data.index ||
          assetData.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        const key = `${type}:${index}`;

        if (existingAssetsMap.has(key)) {
          // UPDATE Existing Asset
          await this.updateAssetUseCase.execute(slug, type, index, {
            data: assetData.data,
          });
          existingAssetsMap.delete(key); // Mark as processed
        } else {
          // CREATE New Asset
          await this.createAssetUseCase.execute(slug, {
            type: type,
            index: index,
            data: assetData.data,
          });
        }
      }

      // 3. Delete Remaining Assets (those not present in incoming DTO)
      for (const [key, asset] of existingAssetsMap) {
        await this.deleteAssetUseCase.execute(
          slug,
          asset.type.toString(),
          asset.index,
        );
      }
    }

    return Result.ok(updatedPack);
  }
}
