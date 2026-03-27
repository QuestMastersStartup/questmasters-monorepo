import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { Result } from '@shared/application/result';
import { CampaignMemberRepository } from '../../domain/repositories/campaign-member.repository';
import { CampaignError } from '../errors';

export interface RemoveMemberDto {
  campaignId: string;
  userId: string;
}

export class RemoveMemberUseCase {
  constructor(private readonly memberRepo: CampaignMemberRepository) {}

  async execute(dto: RemoveMemberDto): Promise<Result<void, CampaignError>> {
    try {
      const campaignUuid = UUID.fromString(dto.campaignId);
      const member = await this.memberRepo.findByUserAndCampaign(dto.userId, campaignUuid);

      if (!member) {
        return Result.fail(CampaignError.NOT_FOUND);
      }

      if (member.role === 'dm') {
        return Result.fail(CampaignError.UNAUTHORIZED); // Can't remove the DM via this use case
      }

      await this.memberRepo.delete(member.id);
      return Result.ok(undefined as any);
    } catch {
      return Result.fail(CampaignError.NOT_FOUND);
    }
  }
}
