import { Result } from '@shared/application/result';
import { Slug } from '@shared/domain/value-objects/slug.vo';
import { ContentPack } from '@content/domain/entities/content-pack.entity';
import {
  ContentPackRepository,
} from '@content/domain/repositories/content-pack.repository';
import { PackError } from '@content/application/errors';
import { PackStatus } from '@content/domain/value-objects/pack-status.vo';

export class ChangePackStatusUseCase {
  constructor(private readonly packRepository: ContentPackRepository) {}

  async execute(
    slug: string,
    newStatusValue: string,
  ): Promise<Result<ContentPack, PackError>> {
    const pack = await this.packRepository.findBySlug(Slug.fromString(slug));

    if (!pack) {
      return Result.fail(PackError.NOT_FOUND);
    }

    if (!PackStatus.isValid(newStatusValue)) {
      return Result.fail(PackError.INVALID_STATUS);
    }

    const newStatus = PackStatus.create(newStatusValue);

    if (!pack.status.canTransitionTo(newStatus)) {
      return Result.fail(PackError.INVALID_STATUS_TRANSITION);
    }

    const updatedPack = pack.changeStatus(newStatus);

    await this.packRepository.save(updatedPack);
    return Result.ok(updatedPack);
  }
}
