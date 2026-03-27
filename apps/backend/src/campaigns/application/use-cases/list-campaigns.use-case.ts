import { Campaign } from '../../domain/entities/campaign.entity';
import { CampaignRepository, CampaignFilters } from '../../domain/repositories/campaign.repository';

export class ListCampaignsUseCase {
  constructor(private readonly campaignRepository: CampaignRepository) {}

  async execute(filters?: CampaignFilters): Promise<Campaign[]> {
    return this.campaignRepository.findAll(filters);
  }
}
