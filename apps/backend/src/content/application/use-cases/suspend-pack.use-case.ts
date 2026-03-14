import { Result } from '@shared/application/result';
import { Slug } from '@shared/domain/value-objects/slug.vo';
import { ContentPack } from '@content/domain/entities/content-pack.entity';
import {
  ContentPackRepository,
  CONTENT_PACK_REPOSITORY,
} from '@content/domain/repositories/content-pack.repository';
import { PackError } from '@content/application/errors';

export class SuspendPackUseCase {
  constructor(private readonly packRepository: ContentPackRepository) {}

  async execute(
    slug: string,
    dto: any,
  ): Promise<Result<ContentPack, PackError>> {
    const pack = await this.packRepository.findBySlug(Slug.fromString(slug));

    if (!pack) {
      return Result.fail(PackError.NOT_FOUND);
    }

    const suspendedPack = pack.suspend(dto.reason);

    await this.packRepository.save(suspendedPack);
    return Result.ok(suspendedPack);
  }
}
