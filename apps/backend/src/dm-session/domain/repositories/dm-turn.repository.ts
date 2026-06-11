import { DmTurn } from '../entities/dm-turn.entity';
import { UUID } from '@shared/domain/value-objects/uuid.vo';

export interface DmTurnRepository {
  save(turn: DmTurn): Promise<void>;
  findBySessionId(sessionId: UUID): Promise<DmTurn[]>;
}

export const DM_TURN_REPOSITORY = Symbol('DmTurnRepository');
