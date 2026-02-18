import { Injectable, Inject } from '@nestjs/common';
import { Result } from '@shared/application/result';
import { Slug } from '@shared/domain/value-objects/slug.vo';
import { ContentPack } from '../../domain/entities/content-pack.entity';
import {
  ContentPackRepository,
  CONTENT_PACK_REPOSITORY,
} from '../../domain/repositories/content-pack.repository';
import { CreatePackDto } from '../dto/pack.dto';
import { PackError } from '../errors';

import { CreateAssetUseCase } from './create-asset.use-case';

@Injectable()
export class CreatePackUseCase {
  constructor(
    @Inject(CONTENT_PACK_REPOSITORY)
    private readonly packRepository: ContentPackRepository,
    private readonly createAssetUseCase: CreateAssetUseCase,
  ) {}

  async execute(dto: CreatePackDto): Promise<Result<ContentPack, PackError>> {
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
        // Mapping frontend payload to CreateAssetDto
        // Frontend sends: { type: string, data: { name, index, ... } }
        const createAssetDto = {
          type: assetData.type,
          index:
            assetData.data.index ||
            assetData.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), // Fallback index
          data: assetData.data,
        };

        await this.createAssetUseCase.execute(dto.slug, createAssetDto);
      }
    }

    return Result.ok(pack);
  }
}
