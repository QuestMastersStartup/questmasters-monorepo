import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { Result } from '@shared/application/result';
import { Character } from '../../domain/entities/character.entity';
import { CharacterRepository } from '../../domain/repositories/character.repository';
import { CharacterError } from '../character-errors';

export interface ListCharactersFilters {
  campaignId?: string;
  userId?: string;
}

export class ListCharactersUseCase {
  constructor(private readonly characterRepo: CharacterRepository) {}

  async execute(filters: ListCharactersFilters): Promise<Result<Character[], CharacterError>> {
    let characters: Character[] = [];

    if (filters.campaignId) {
      characters = await this.characterRepo.findByCampaignId(UUID.fromString(filters.campaignId));
    } else if (filters.userId) {
      characters = await this.characterRepo.findByUserId(filters.userId);
    }

    return Result.ok(characters);
  }
}
