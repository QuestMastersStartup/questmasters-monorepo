import { Character } from '../entities/character.entity';
import { UUID } from '@shared/domain/value-objects/uuid.vo';

export interface CharacterRepository {
  save(character: Character): Promise<void>;
  findById(id: UUID): Promise<Character | null>;
  findByCampaignId(campaignId: UUID): Promise<Character[]>;
  findByUserId(userId: string): Promise<Character[]>;
  findByUserAndCampaign(userId: string, campaignId: UUID): Promise<Character[]>;
  findActiveByUserAndCampaign(userId: string, campaignId: UUID): Promise<Character | null>;
  delete(id: UUID): Promise<void>;
}

export const CHARACTER_REPOSITORY = Symbol('CharacterRepository');
