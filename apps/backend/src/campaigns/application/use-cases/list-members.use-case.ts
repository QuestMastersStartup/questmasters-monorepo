import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { Result } from '@shared/application/result';
import { CampaignMember } from '../../domain/entities/campaign-member.entity';
import { CampaignMemberRepository } from '../../domain/repositories/campaign-member.repository';
import { CampaignError } from '../errors';

export class ListMembersUseCase {
  constructor(private readonly memberRepo: CampaignMemberRepository) {}

  async execute(campaignId: string): Promise<Result<CampaignMember[], CampaignError>> {
    try {
      const uuid = UUID.fromString(campaignId);
      const members = await this.memberRepo.findByCampaignId(uuid);
      return Result.ok(members);
    } catch {
      return Result.fail(CampaignError.NOT_FOUND);
    }
  }
}
