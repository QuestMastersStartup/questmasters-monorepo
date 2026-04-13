import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { Result } from '@shared/application/result';
import { Character } from '../../domain/entities/character.entity';
import { CharacterRepository } from '../../domain/repositories/character.repository';
import { CampaignMemberRepository } from '../../../campaigns/domain/repositories/campaign-member.repository';
import { CharacterError } from '../character-errors';
import { AbilityScores, validatePointBuy } from '@questmasters/dnd-rules';

export interface UpdateCharacterDto {
  id: string;
  requesterId: string; // userId requesting the update
  // Owner fields
  name?: string;
  backstory?: string | null;
  portraitUrl?: string | null;
  choices?: Record<string, any> | null;
  // DM fields
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

      // Handle Owner Update
      if (isOwner) {
        character = character.update({
          name: dto.name,
          backstory: dto.backstory,
          portraitUrl: dto.portraitUrl,
          choices: dto.choices,
        });
      }

      // Handle DM Update (or owner in free mode)
      if (isDm) {
        // Stats validation if changed
        if (dto.stats) {
          // In campaign mode, Point Buy is enforced? No, DM can override
          // But we validate range at least
          for (const stat of Object.values(dto.stats)) {
            if (stat < 1 || stat > 30) return Result.fail(CharacterError.INVALID_STATS);
          }
        }

        character = character.updateByDm({
          stats: dto.stats,
          level: dto.level,
          hitPoints: dto.hitPoints,
          status: dto.status ? (await import('../../domain/value-objects/character-status.vo')).CharacterStatus.create(dto.status) : undefined,
        });
      }

      await this.characterRepo.save(character);

      return Result.ok(character);
    } catch {
      return Result.fail(CharacterError.INVALID_STATS);
    }
  }
}
