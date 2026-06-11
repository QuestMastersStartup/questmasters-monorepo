import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { Result } from '@shared/application/result';
import { DmSession } from '../../domain/entities/dm-session.entity';
import { DmSessionRepository } from '../../domain/repositories/dm-session.repository';
import { DmSessionError } from '../errors';

export interface EndDmSessionDto {
  sessionId: string;
  userId: string;
  isAdmin: boolean;
}

export class EndDmSessionUseCase {
  constructor(private readonly sessionRepo: DmSessionRepository) {}

  async execute(dto: EndDmSessionDto): Promise<Result<DmSession, DmSessionError>> {
    const session = await this.sessionRepo.findById(UUID.fromString(dto.sessionId));
    if (!session) return Result.fail(DmSessionError.NOT_FOUND);

    if (!session.isOwnedBy(dto.userId) && !dto.isAdmin) {
      return Result.fail(DmSessionError.UNAUTHORIZED);
    }

    if (session.status === 'ended') return Result.fail(DmSessionError.ALREADY_ENDED);

    const ended = session.end();
    await this.sessionRepo.save(ended);

    return Result.ok(ended);
  }
}
