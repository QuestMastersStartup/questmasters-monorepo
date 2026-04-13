import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { Result } from '@shared/application/result';
import { CharacterRepository } from '../../domain/repositories/character.repository';
import { CampaignMemberRepository } from '../../../campaigns/domain/repositories/campaign-member.repository';
import { CharacterError } from '../character-errors';

export interface DeleteCharacterDto {
  id: string;
  requesterId: string;
}

export class DeleteCharacterUseCase {
  constructor(
    private readonly characterRepo: CharacterRepository,
    private readonly memberRepo: CampaignMemberRepository,
  ) {}

  async execute(dto: DeleteCharacterDto): Promise<Result<void, CharacterError>> {
    try {
      const character = await this.characterRepo.findById(UUID.fromString(dto.id));
      if (!character) return Result.fail(CharacterError.NOT_FOUND);

      const isOwner = character.userId === dto.requesterId;
      let isDm = false;

      if (character.campaignId) {
        const member = await this.memberRepo.findByUserAndCampaign(dto.requesterId, character.campaignId);
        isDm = member?.role === 'dm';
      } else {
        isDm = isOwner;
      }

      if (!isOwner && !isDm) {
        return Result.fail(CharacterError.UNAUTHORIZED);
      }

      await this.characterRepo.delete(character.id);
      return Result.ok(undefined);
    } catch {
      return Result.fail(CharacterError.NOT_FOUND);
    }
  }
}
