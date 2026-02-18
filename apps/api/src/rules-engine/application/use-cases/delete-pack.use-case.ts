import { Injectable, Inject } from '@nestjs/common';
import { Result } from '@shared/application/result';
import { Slug } from '@shared/domain/value-objects/slug.vo';
import {
  ContentPackRepository,
  CONTENT_PACK_REPOSITORY,
} from '@rules-engine/domain/repositories/content-pack.repository';
import { PackError } from '@rules-engine/application/errors';

@Injectable()
export class DeletePackUseCase {
  constructor(
    @Inject(CONTENT_PACK_REPOSITORY)
    private readonly packRepository: ContentPackRepository,
  ) {}

  async execute(slug: string): Promise<Result<void, PackError>> {
    const pack = await this.packRepository.findBySlug(Slug.fromString(slug));

    if (!pack) {
      return Result.fail(PackError.NOT_FOUND);
    }

    // Here you might want to check for constraints, e.g. "Can't delete if referenced by others"
    // Or check if it has assets? The database might enforce cascade or failure.
    // For now, we assume direct deletion.

    await this.packRepository.delete(pack.id);
    return Result.ok(void 0);
  }
}
