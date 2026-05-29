import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { Slug } from '@shared/domain/value-objects/slug.vo';
import { Result } from '@shared/application/result';
import { AssetRepository } from '../../../content/domain/repositories/asset.repository';
import { ContentPackRepository } from '../../../content/domain/repositories/content-pack.repository';
import { CampaignRepository } from '../../../campaigns/domain/repositories/campaign.repository';
import { Asset } from '../../../content/domain/entities/asset.entity';
import { CharacterError } from '../character-errors';

// Maps system IDs to their canonical SRD pack slugs (seeded at boot)
const SYSTEM_SRD_SLUGS: Record<string, string> = {
  'dnd-5e-2014': 'srd-dnd-5e-2014',
  'dnd-5e-2024': 'srd-dnd-5e-2024',
};

export interface ListAvailableAssetsDto {
  campaignId?: string;
  type?: string;
  query?: string;
  /** Vanilla mode: filter by system, looks up the matching SRD pack */
  system?: string;
  /** Personalizado mode: explicit list of pack IDs to include */
  packIds?: string[];
}

export interface AvailableAssetsResult {
  races: Asset[];
  subraces: Asset[];
  classes: Asset[];
  backgrounds: Asset[];
}

export class ListAvailableAssetsUseCase {
  constructor(
    private readonly assetRepo: AssetRepository,
    private readonly campaignRepo: CampaignRepository,
    private readonly packRepo: ContentPackRepository,
  ) {}

  async execute(dto: ListAvailableAssetsDto): Promise<Result<AvailableAssetsResult, CharacterError>> {
    try {
      let resolvedPackIds: string[] | undefined;

      if (dto.packIds && dto.packIds.length > 0) {
        // Personalizado mode: user explicitly chose packs
        resolvedPackIds = dto.packIds;

      } else if (dto.campaignId) {
        // Campaign mode: use the campaign's installed packs
        const campaign = await this.campaignRepo.findById(UUID.fromString(dto.campaignId));
        if (!campaign) return Result.fail(CharacterError.NOT_FOUND);
        resolvedPackIds = campaign.installedPackIds.map(id => id.toString());

      } else if (dto.system && SYSTEM_SRD_SLUGS[dto.system]) {
        // Vanilla mode: look up the canonical SRD pack for this system
        const srdPack = await this.packRepo.findBySlug(
          Slug.create(SYSTEM_SRD_SLUGS[dto.system]),
        );
        if (srdPack) {
          resolvedPackIds = [srdPack.id.toString()];
        }
        // If SRD pack not found (not seeded yet), fall through to all packs
      }
      // No filters → return all available assets (libre fallback)

      const baseFilters = {
        name: dto.query,
        packIds: resolvedPackIds,
      };

      // Four separate typed queries avoid the search() limit pooling issue
      const [races, subraces, classes, backgrounds] = await Promise.all([
        this.assetRepo.search({ ...baseFilters, type: 'race' }),
        this.assetRepo.search({ ...baseFilters, type: 'subrace' }),
        this.assetRepo.search({ ...baseFilters, type: 'class' }),
        this.assetRepo.search({ ...baseFilters, type: 'background' }),
      ]);

      return Result.ok({ races, subraces, classes, backgrounds });
    } catch (e) {
      console.error(e);
      return Result.fail(CharacterError.NOT_FOUND);
    }
  }
}
