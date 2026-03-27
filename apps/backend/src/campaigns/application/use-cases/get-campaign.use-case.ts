import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { Result } from '@shared/application/result';
import { Campaign } from '../../domain/entities/campaign.entity';
import { CampaignRepository } from '../../domain/repositories/campaign.repository';
import { CampaignError } from '../errors';

export class GetCampaignUseCase {
  constructor(private readonly campaignRepository: CampaignRepository) {}

  async execute(id: string): Promise<Result<Campaign, CampaignError>> {
    try {
      const uuid = UUID.fromString(id);
      const campaign = await this.campaignRepository.findById(uuid);

      if (!campaign) {
        return Result.fail(CampaignError.NOT_FOUND);
      }

      return Result.ok(campaign);
    } catch {
      return Result.fail(CampaignError.NOT_FOUND);
    }
  }
}
