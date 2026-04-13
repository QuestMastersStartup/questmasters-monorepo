import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { Result } from '@shared/application/result';
import { AssetRepository } from '../../../content/domain/repositories/asset.repository';
import { CampaignRepository } from '../../../campaigns/domain/repositories/campaign.repository';
import { Asset } from '../../../content/domain/entities/asset.entity';
import { CharacterError } from '../character-errors';

export interface ListAvailableAssetsDto {
  campaignId?: string;
  type?: string;
  query?: string;
}

export interface AvailableAssetsResult {
  races: Asset[];
  classes: Asset[];
  backgrounds: Asset[];
}

export class ListAvailableAssetsUseCase {
  constructor(
    private readonly assetRepo: AssetRepository,
    private readonly campaignRepo: CampaignRepository,
  ) {}

  async execute(dto: ListAvailableAssetsDto): Promise<Result<AvailableAssetsResult, CharacterError>> {
    try {
      const filters: { type?: string; name?: string; packIds?: string[] } = {
        type: dto.type,
        name: dto.query,
      };

      if (dto.campaignId) {
        const campaign = await this.campaignRepo.findById(UUID.fromString(dto.campaignId));
        if (!campaign) return Result.fail(CharacterError.NOT_FOUND);
        filters.packIds = campaign.installedPackIds.map(id => id.toString());
      } else {
        // For free characters, searching in all active packs is standard
        // But the repository 'search' method handles the null packIds case by not filtering by pack.
      }

      const allAssets = await this.assetRepo.search(filters);

      const result: AvailableAssetsResult = {
        races: allAssets.filter(a => a.type.toString() === 'race'),
        classes: allAssets.filter(a => a.type.toString() === 'class'),
        backgrounds: allAssets.filter(a => a.type.toString() === 'background'),
      };

      return Result.ok(result);
    } catch (e) {
      console.error(e);
      return Result.fail(CharacterError.NOT_FOUND);
    }
  }
}
