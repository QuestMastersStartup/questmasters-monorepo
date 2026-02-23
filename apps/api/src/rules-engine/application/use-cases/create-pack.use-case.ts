import { Result } from '@shared/application/result';
import { Slug } from '@shared/domain/value-objects/slug.vo';
import { ContentPack } from '../../domain/entities/content-pack.entity';
import {
  ContentPackRepository,
  CONTENT_PACK_REPOSITORY,
} from '../../domain/repositories/content-pack.repository';
import { PackError } from '../errors';

import { CreateAssetUseCase } from './create-asset.use-case';

export class CreatePackUseCase {
  constructor(
    private readonly packRepository: ContentPackRepository,
    private readonly createAssetUseCase: CreateAssetUseCase,
  ) {}

  async execute(dto: any): Promise<Result<ContentPack, PackError>> {
    const slug = Slug.create(dto.slug);
    const exists = await this.packRepository.existsBySlug(slug);

    if (exists) {
      return Result.fail(PackError.SLUG_ALREADY_EXISTS);
    }

    const pack = ContentPack.create({
      slug: dto.slug,
      name: dto.name,
      description: dto.description,
      version: dto.version,
      type: dto.type,
      system: dto.system ?? 'universal',
      creatorId: dto.creatorId,
      dependencies: dto.dependencies,
    });

    await this.packRepository.save(pack);

    if (dto.assets && dto.assets.length > 0) {
      for (const assetData of dto.assets) {
        const createAssetDto = {
          type: assetData.type,
          index:
            assetData.data.index ||
            assetData.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          data: assetData.data,
        };

        await this.createAssetUseCase.execute(dto.slug, createAssetDto);
      }
    }

    return Result.ok(pack);
  }
}
