import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { Result } from '@shared/application/result';
import { Character } from '../../domain/entities/character.entity';
import { CharacterRepository } from '../../domain/repositories/character.repository';
import { CampaignRepository } from '../../../campaigns/domain/repositories/campaign.repository';
import { CampaignMemberRepository } from '../../../campaigns/domain/repositories/campaign-member.repository';
import { AssetRepository } from '../../../content/domain/repositories/asset.repository';
import { CharacterError } from '../character-errors';
import { 
  validatePointBuy, 
  calculateHitPoints, 
  AbilityScores 
} from '@questmasters/dnd-rules';

export interface CreateCharacterDto {
  campaignId?: string;
  userId: string;
  name: string;
  raceAssetId?: string | null;
  classAssetId?: string | null;
  backgroundAssetId?: string | null;
  stats: AbilityScores;
  portraitUrl?: string;
  backstory?: string;
  choices?: Record<string, any>;
  method: 'point-buy' | 'free' | 'libre';
  /** Optional HP override from the frontend (random roll or manual entry). */
  hitPoints?: number;
}

export class CreateCharacterUseCase {
  constructor(
    private readonly characterRepo: CharacterRepository,
    private readonly campaignRepo: CampaignRepository,
    private readonly memberRepo: CampaignMemberRepository,
    private readonly assetRepo: AssetRepository,
  ) {}

  async execute(dto: CreateCharacterDto): Promise<Result<Character, CharacterError>> {
    try {
      const campaignUuid = dto.campaignId ? UUID.fromString(dto.campaignId) : null;

      // ── Libre mode: no asset validation, free stats ───────────────────
      if (dto.method === 'libre') {
        for (const stat of Object.values(dto.stats as Record<string, number>)) {
          if (stat < 1 || stat > 30) return Result.fail(CharacterError.INVALID_STATS);
        }
        const character = Character.create({
          campaignId: dto.campaignId,
          userId: dto.userId,
          name: dto.name,
          raceAssetId: null,
          classAssetId: null,
          backgroundAssetId: undefined,
          stats: dto.stats,
          hitPoints: dto.hitPoints ?? 10, // frontend override or fallback default
          portraitUrl: dto.portraitUrl,
          backstory: dto.backstory,
          choices: dto.choices ?? {},
        });
        await this.characterRepo.save(character);
        return Result.ok(character);
      }

      // ── Standard and Point-buy modes require asset IDs ────────────────
      if (!dto.raceAssetId || !dto.classAssetId) {
        return Result.fail(CharacterError.INVALID_STATS);
      }

      // 1. Validation Logic
      if (campaignUuid) {
        const campaign = await this.campaignRepo.findById(campaignUuid);
        if (!campaign) return Result.fail(CharacterError.NOT_FOUND);
        if (campaign.status.toString() !== 'active') return Result.fail(CharacterError.CAMPAIGN_NOT_ACTIVE);

        const member = await this.memberRepo.findByUserAndCampaign(dto.userId, campaignUuid);
        if (!member) return Result.fail(CharacterError.NOT_A_MEMBER);

        const existingActive = await this.characterRepo.findActiveByUserAndCampaign(dto.userId, campaignUuid);
        if (existingActive) return Result.fail(CharacterError.ALREADY_EXISTS);

        // Validate assets are in campaign packs
        const campaignPackIds = campaign.installedPackIds.map(id => id.toString());
        
        const assetsToValidate = [dto.raceAssetId, dto.classAssetId];
        if (dto.backgroundAssetId) assetsToValidate.push(dto.backgroundAssetId);

        for (const assetIdStr of assetsToValidate) {
          const asset = await this.assetRepo.findById(UUID.fromString(assetIdStr));
          if (!asset || !campaignPackIds.includes(asset.packId.toString())) {
            return Result.fail(CharacterError.ASSET_NOT_IN_CAMPAIGN);
          }
        }

        // Point Buy is mandatory for campaign characters (as currently defined by US-4.1)
        const validation = validatePointBuy(dto.stats);
        if (!validation.valid) return Result.fail(CharacterError.INVALID_STATS);
      } else {
        // Free character: Point Buy is optional
        if (dto.method === 'point-buy') {
          const validation = validatePointBuy(dto.stats);
          if (!validation.valid) return Result.fail(CharacterError.INVALID_STATS);
        } else {
          // 'free' method: just basic range check (1-30 as per user "liber de crearlo como quiera")
          for (const stat of Object.values(dto.stats as Record<string, number>)) {
            if (stat < 1 || stat > 30) return Result.fail(CharacterError.INVALID_STATS);
          }
        }

        // Just validate asset existence
        const assetsToValidate = [dto.raceAssetId, dto.classAssetId];
        if (dto.backgroundAssetId) assetsToValidate.push(dto.backgroundAssetId);

        for (const assetIdStr of assetsToValidate) {
          const exists = await this.assetRepo.findById(UUID.fromString(assetIdStr));
          if (!exists) return Result.fail(CharacterError.NOT_FOUND);
        }
      }

      // 2. Resolve HP: use frontend override if provided, otherwise calculate max
      const classAsset = await this.assetRepo.findById(UUID.fromString(dto.classAssetId));
      const hitDie = classAsset?.data.get<number>('hit_die') ?? 10;
      const hitPointsResult = calculateHitPoints(hitDie, dto.stats.constitution, 1);
      const resolvedHp = dto.hitPoints
        ? Math.max(1, Math.min(dto.hitPoints, hitPointsResult.maxHp)) // clamp to [1, max]
        : hitPointsResult.maxHp;

      // 3. Create Entity
      const character = Character.create({
        campaignId: dto.campaignId,
        userId: dto.userId,
        name: dto.name,
        raceAssetId: dto.raceAssetId,
        classAssetId: dto.classAssetId,
        backgroundAssetId: dto.backgroundAssetId ?? undefined,
        stats: dto.stats,
        hitPoints: resolvedHp,
        portraitUrl: dto.portraitUrl,
        backstory: dto.backstory,
        choices: dto.choices,
      });

      await this.characterRepo.save(character);

      return Result.ok(character);
    } catch (e) {
      console.error(e);
      return Result.fail(CharacterError.INVALID_STATS);
    }
  }
}
