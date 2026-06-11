import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { Result } from '@shared/application/result';
import { Character } from '../../domain/entities/character.entity';
import { CharacterRepository } from '../../domain/repositories/character.repository';
import { CampaignMemberRepository } from '../../../campaigns/domain/repositories/campaign-member.repository';
import { CharacterError } from '../character-errors';
import { AbilityScores, validatePointBuy } from '@questmasters/dnd-rules';

export interface UpdateCharacterDto {
  id: string;
  requesterId: string;
  name?: string;
  backstory?: string | null;
  portraitUrl?: string | null;
  choices?: Record<string, any> | null;
  raceAssetId?: string | null;
  classAssetId?: string | null;
  backgroundAssetId?: string | null;
  stats?: AbilityScores;
  level?: number;
  hitPoints?: number;
  status?: string;
}

export class UpdateCharacterUseCase {
  constructor(
    private readonly characterRepo: CharacterRepository,
    private readonly memberRepo: CampaignMemberRepository,
  ) {}

  async execute(dto: UpdateCharacterDto): Promise<Result<Character, CharacterError>> {
    try {
      let character = await this.characterRepo.findById(UUID.fromString(dto.id));
      if (!character) return Result.fail(CharacterError.NOT_FOUND);

      const isOwner = character.userId === dto.requesterId;
      let isDm = false;

      if (character.campaignId) {
        const member = await this.memberRepo.findByUserAndCampaign(dto.requesterId, character.campaignId);
        isDm = member?.role === 'dm';
      } else {
        // If no campaign, the owner acts as the DM (self-management)
        isDm = isOwner;
      }

      if (!isOwner && !isDm) {
        return Result.fail(CharacterError.UNAUTHORIZED);
      }

      // Validate stats range if provided
      if (dto.stats) {
        for (const stat of Object.values(dto.stats as Record<string, number>)) {
          if (stat < 1 || stat > 30) return Result.fail(CharacterError.INVALID_STATS);
        }
      }

      const { CharacterStatus } = await import('../../domain/value-objects/character-status.vo');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateProps: any = {};
      if (dto.name !== undefined)      updateProps.name        = dto.name;
      if (dto.backstory !== undefined) updateProps.backstory   = dto.backstory;
      if (dto.portraitUrl !== undefined) updateProps.portraitUrl = dto.portraitUrl;
      if (dto.choices !== undefined)   updateProps.choices     = dto.choices;
      if (dto.stats !== undefined)     updateProps.stats       = dto.stats;
      if (dto.level !== undefined)     updateProps.level       = dto.level;
      if (dto.hitPoints !== undefined) updateProps.hitPoints   = dto.hitPoints;
      if (dto.status !== undefined)    updateProps.status      = CharacterStatus.create(dto.status);
      if ('raceAssetId' in dto)       updateProps.raceAssetId       = dto.raceAssetId ? UUID.fromString(dto.raceAssetId) : null;
      if ('classAssetId' in dto)      updateProps.classAssetId      = dto.classAssetId ? UUID.fromString(dto.classAssetId) : null;
      if ('backgroundAssetId' in dto) updateProps.backgroundAssetId = dto.backgroundAssetId ? UUID.fromString(dto.backgroundAssetId) : null;

      character = character.update(updateProps);

      await this.characterRepo.save(character);

      return Result.ok(character);
    } catch {
      return Result.fail(CharacterError.INVALID_STATS);
    }
  }
}
