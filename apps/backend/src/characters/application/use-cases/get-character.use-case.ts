import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { Result } from '@shared/application/result';
import { Character } from '../../domain/entities/character.entity';
import { CharacterRepository } from '../../domain/repositories/character.repository';
import { CharacterError } from '../character-errors';

export class GetCharacterUseCase {
  constructor(private readonly characterRepo: CharacterRepository) {}

  async execute(id: string): Promise<Result<Character, CharacterError>> {
    try {
      const character = await this.characterRepo.findById(UUID.fromString(id));
      if (!character) return Result.fail(CharacterError.NOT_FOUND);
      return Result.ok(character);
    } catch {
      return Result.fail(CharacterError.NOT_FOUND);
    }
  }
}
