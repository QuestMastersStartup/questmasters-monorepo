import { Result } from '@shared/application/result';
import { Slug } from '@shared/domain/value-objects/slug.vo';
import {
  ContentPackRepository,
  CONTENT_PACK_REPOSITORY,
} from '@content/domain/repositories/content-pack.repository';
import { PackError } from '@content/application/errors';

export class DeletePackUseCase {
  constructor(private readonly packRepository: ContentPackRepository) {}

  async execute(slug: string): Promise<Result<void, PackError>> {
    const pack = await this.packRepository.findBySlug(Slug.fromString(slug));

    if (!pack) {
      return Result.fail(PackError.NOT_FOUND);
    }

    await this.packRepository.delete(pack.id);
    return Result.ok(void 0);
  }
}
