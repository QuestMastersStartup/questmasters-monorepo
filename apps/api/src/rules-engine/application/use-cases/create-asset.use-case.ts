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
import { AssetError } from '../errors';
import { AssetType } from '../../domain/value-objects/asset-type.vo';

export class CreateAssetUseCase {
  constructor(
    private readonly assetRepository: AssetRepository,
    private readonly packRepository: ContentPackRepository,
  ) {}

  async execute(
    packSlug: string,
    dto: any,
  ): Promise<Result<Asset, AssetError>> {
    const pack = await this.packRepository.findBySlug(
      Slug.fromString(packSlug),
    );

    if (!pack) {
      return Result.fail(AssetError.PACK_NOT_FOUND);
    }

    const assetType = AssetType.create(dto.type);
    const exists = await this.assetRepository.existsByPackAndTypeAndIndex(
      pack.id,
      assetType,
      dto.index,
    );

    if (exists) {
      return Result.fail(AssetError.ALREADY_EXISTS);
    }

    const name = (dto.data as any).name || dto.index;
    const asset = Asset.create({
      packId: pack.id.toString(),
      type: dto.type,
      index: dto.index,
      name,
      data: dto.data,
    });

    await this.assetRepository.save(asset);
    return Result.ok(asset);
  }
}
