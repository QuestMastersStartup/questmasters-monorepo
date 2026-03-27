import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { Result } from '@shared/application/result';
import { Campaign } from '../../domain/entities/campaign.entity';
import { CampaignRepository } from '../../domain/repositories/campaign.repository';
import { CampaignError } from '../errors';

export interface UpdateCampaignDto {
  name?: string;
  description?: string;
  coverImageUrl?: string | null;
  installedPackIds?: string[];
}

export class UpdateCampaignUseCase {
  constructor(private readonly campaignRepository: CampaignRepository) {}

  async execute(id: string, dto: UpdateCampaignDto): Promise<Result<Campaign, CampaignError>> {
    try {
      const uuid = UUID.fromString(id);
      let campaign = await this.campaignRepository.findById(uuid);

      if (!campaign) {
        return Result.fail(CampaignError.NOT_FOUND);
      }

      campaign = campaign.update({
        name: dto.name,
        description: dto.description,
        coverImageUrl: dto.coverImageUrl,
      });

      if (dto.installedPackIds) {
        campaign = campaign.installPacks(dto.installedPackIds.map(id => UUID.fromString(id)));
      }

      await this.campaignRepository.save(campaign);

      return Result.ok(campaign);
    } catch {
      return Result.fail(CampaignError.NOT_FOUND);
    }
  }
}
