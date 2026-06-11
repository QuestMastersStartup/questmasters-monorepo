import { Result } from '@shared/application/result';
import { DmSession } from '../../domain/entities/dm-session.entity';
import { DmSessionRepository } from '../../domain/repositories/dm-session.repository';
import { DmSessionError } from '../errors';

export interface ListDmSessionsDto {
  userId: string;
  isAdmin: boolean;
}

export class ListDmSessionsUseCase {
  constructor(private readonly sessionRepo: DmSessionRepository) {}

  async execute(dto: ListDmSessionsDto): Promise<Result<DmSession[], DmSessionError>> {
    const sessions = dto.isAdmin
      ? await this.sessionRepo.findAll()
      : await this.sessionRepo.findByUserId(dto.userId);

    return Result.ok(sessions);
  }
}
