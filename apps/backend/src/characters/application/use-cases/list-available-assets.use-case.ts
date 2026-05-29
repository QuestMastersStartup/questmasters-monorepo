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
  /** Vanilla mode: filter by system compatibility (e.g. 'dnd-5e-2024') */
  system?: string;
  /** Personalizado mode: explicit list of pack IDs to include */
  packIds?: string[];
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
      const baseFilters: { type?: string; name?: string; packIds?: string[] } = {
        type: dto.type,
        name: dto.query,
      };

      // Priority: explicit packIds > campaignId > system > all
      if (dto.packIds && dto.packIds.length > 0) {
        // Personalizado mode: use the packs the user explicitly chose
        baseFilters.packIds = dto.packIds;
      } else if (dto.campaignId) {
        // Campaign mode: use campaign's installed packs (existing behaviour)
        const campaign = await this.campaignRepo.findById(UUID.fromString(dto.campaignId));
        if (!campaign) return Result.fail(CharacterError.NOT_FOUND);
        baseFilters.packIds = campaign.installedPackIds.map(id => id.toString());
      }
      // Vanilla system filter and "all packs" fall through to post-filter below

      const allAssets = await this.assetRepo.search(baseFilters);

      // Vanilla mode: filter by system compatibility in-memory
      const assets = dto.system && !dto.packIds && !dto.campaignId
        ? allAssets.filter(a => {
            const compat: string[] = (a as any).compatibleWith ?? [];
            return compat.length === 0 || compat.includes(dto.system!);
          })
        : allAssets;

      return Result.ok({
        races:       assets.filter(a => a.type.toString() === 'race'),
        classes:     assets.filter(a => a.type.toString() === 'class'),
        backgrounds: assets.filter(a => a.type.toString() === 'background'),
      });
    } catch (e) {
      console.error(e);
      return Result.fail(CharacterError.NOT_FOUND);
    }
  }
}
