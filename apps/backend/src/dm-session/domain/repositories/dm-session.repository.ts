import { DmSession } from '../entities/dm-session.entity';
import { UUID } from '@shared/domain/value-objects/uuid.vo';

export interface DmSessionRepository {
  save(session: DmSession): Promise<void>;
  findById(id: UUID): Promise<DmSession | null>;
  findByUserId(userId: string): Promise<DmSession[]>;
  findAll(): Promise<DmSession[]>;
}

export const DM_SESSION_REPOSITORY = Symbol('DmSessionRepository');
