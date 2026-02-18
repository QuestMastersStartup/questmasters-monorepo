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
import { CreateAssetDtoNew } from '../dto/asset.dto';
import { AssetError } from '../errors';
import { AssetType } from '../../domain/value-objects/asset-type.vo';

@Injectable()
export class CreateAssetUseCase {
  constructor(
    @Inject(ASSET_REPOSITORY)
    private readonly assetRepository: AssetRepository,
    @Inject(CONTENT_PACK_REPOSITORY)
    private readonly packRepository: ContentPackRepository,
  ) {}

  async execute(
    packSlug: string,
    dto: CreateAssetDtoNew,
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
