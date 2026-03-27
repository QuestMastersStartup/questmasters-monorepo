import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { Result } from '@shared/application/result';
import { CampaignRepository } from '../../domain/repositories/campaign.repository';
import { CampaignError } from '../errors';

export class DeleteCampaignUseCase {
  constructor(private readonly campaignRepository: CampaignRepository) {}

  async execute(id: string): Promise<Result<void, CampaignError>> {
    try {
      const uuid = UUID.fromString(id);
      const exists = await this.campaignRepository.exists(uuid);

      if (!exists) {
        return Result.fail(CampaignError.NOT_FOUND);
      }

      await this.campaignRepository.delete(uuid);
      return Result.ok(undefined);
    } catch {
      return Result.fail(CampaignError.NOT_FOUND);
    }
  }
}
