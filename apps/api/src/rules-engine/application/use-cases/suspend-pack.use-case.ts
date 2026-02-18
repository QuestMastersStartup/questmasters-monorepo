import { Injectable, Inject } from '@nestjs/common';
import { Result } from '@shared/application/result';
import { Slug } from '@shared/domain/value-objects/slug.vo';
import { ContentPack } from '@rules-engine/domain/entities/content-pack.entity';
import {
  ContentPackRepository,
  CONTENT_PACK_REPOSITORY,
} from '@rules-engine/domain/repositories/content-pack.repository';
import { SuspendPackDto } from '@rules-engine/application/dto/pack.dto';
import { PackError } from '@rules-engine/application/errors';

@Injectable()
export class SuspendPackUseCase {
  constructor(
    @Inject(CONTENT_PACK_REPOSITORY)
    private readonly packRepository: ContentPackRepository,
  ) {}

  async execute(
    slug: string,
    dto: SuspendPackDto,
  ): Promise<Result<ContentPack, PackError>> {
    const pack = await this.packRepository.findBySlug(Slug.fromString(slug));

    if (!pack) {
      return Result.fail(PackError.NOT_FOUND);
    }

    // You could check here if it's already suspended if desired,
    // but the domain method handles the state transition idempotently or throws if invalid logic.
    // In our entity, suspend() returns a new instance with isSuspended=true.

    const suspendedPack = pack.suspend(dto.reason);

    await this.packRepository.save(suspendedPack);
    return Result.ok(suspendedPack);
  }
}
