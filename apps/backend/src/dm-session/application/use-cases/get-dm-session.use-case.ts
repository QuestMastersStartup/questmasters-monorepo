import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { Result } from '@shared/application/result';
import { DmSession } from '../../domain/entities/dm-session.entity';
import { DmTurn } from '../../domain/entities/dm-turn.entity';
import { DmSessionRepository } from '../../domain/repositories/dm-session.repository';
import { DmTurnRepository } from '../../domain/repositories/dm-turn.repository';
import { DmSessionError } from '../errors';

export interface GetDmSessionDto {
  sessionId: string;
  userId: string;
  isAdmin: boolean;
}

export interface DmSessionWithTurns {
  session: DmSession;
  turns: DmTurn[];
}

export class GetDmSessionUseCase {
  constructor(
    private readonly sessionRepo: DmSessionRepository,
    private readonly turnRepo: DmTurnRepository,
  ) {}

  async execute(dto: GetDmSessionDto): Promise<Result<DmSessionWithTurns, DmSessionError>> {
    const session = await this.sessionRepo.findById(UUID.fromString(dto.sessionId));
    if (!session) return Result.fail(DmSessionError.NOT_FOUND);

    // Admin puede ver cualquier sesión; usuario normal solo las suyas
    if (!session.isOwnedBy(dto.userId) && !dto.isAdmin) {
      return Result.fail(DmSessionError.UNAUTHORIZED);
    }

    const turns = await this.turnRepo.findBySessionId(session.id);

    return Result.ok({ session, turns });
  }
}
