import { Result } from '@shared/application/result';
import { Campaign } from '../../domain/entities/campaign.entity';
import { CampaignRepository } from '../../domain/repositories/campaign.repository';
import { CampaignError } from '../errors';

export interface CreateCampaignDto {
  name: string;
  description?: string;
  system?: string;
  coverImageUrl?: string;
  dmId: string;
  installedPackIds?: string[];
}

export class CreateCampaignUseCase {
  constructor(private readonly campaignRepository: CampaignRepository) {}

  async execute(dto: CreateCampaignDto): Promise<Result<Campaign, CampaignError>> {
    const campaign = Campaign.create({
      name: dto.name,
      description: dto.description,
      system: dto.system ?? 'dnd-5e-2014',
      coverImageUrl: dto.coverImageUrl,
      dmId: dto.dmId,
      installedPackIds: dto.installedPackIds,
    });

    await this.campaignRepository.save(campaign);

    return Result.ok(campaign);
  }
}
