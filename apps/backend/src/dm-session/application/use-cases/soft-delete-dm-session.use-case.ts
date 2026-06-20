import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { Result } from '@shared/application/result';
import { DmSession } from '../../domain/entities/dm-session.entity';
import type { DmSessionRepository } from '../../domain/repositories/dm-session.repository';
import { DmSessionError } from '../errors';

export interface SoftDeleteDmSessionDto {
  sessionId: string;
  userId: string;
  isAdmin: boolean;
}

export class SoftDeleteDmSessionUseCase {
  constructor(private readonly sessionRepo: DmSessionRepository) {}

  async execute(dto: SoftDeleteDmSessionDto): Promise<Result<DmSession, DmSessionError>> {
    const session = await this.sessionRepo.findById(UUID.fromString(dto.sessionId));
    if (!session) return Result.fail(DmSessionError.NOT_FOUND);

    if (!session.isOwnedBy(dto.userId) && !dto.isAdmin) {
      return Result.fail(DmSessionError.UNAUTHORIZED);
    }

    const deleted = session.softDelete();
    await this.sessionRepo.save(deleted);

    return Result.ok(deleted);
  }
}
