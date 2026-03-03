import { Result } from '@shared/application/result';
import { Slug } from '@shared/domain/value-objects/slug.vo';
import { ContentPack } from '@rules-engine/domain/entities/content-pack.entity';
import {
  ContentPackRepository,
  CONTENT_PACK_REPOSITORY,
} from '@rules-engine/domain/repositories/content-pack.repository';
import { PackError } from '@rules-engine/application/errors';

export class UnsuspendPackUseCase {
  constructor(private readonly packRepository: ContentPackRepository) {}

  async execute(slug: string): Promise<Result<ContentPack, PackError>> {
    const pack = await this.packRepository.findBySlug(Slug.fromString(slug));

    if (!pack) {
      return Result.fail(PackError.NOT_FOUND);
    }

    const unsuspendedPack = pack.unsuspend();

    await this.packRepository.save(unsuspendedPack);
    return Result.ok(unsuspendedPack);
  }
}
