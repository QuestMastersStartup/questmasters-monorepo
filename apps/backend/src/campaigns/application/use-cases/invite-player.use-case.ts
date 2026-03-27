import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { Result } from '@shared/application/result';
import { CampaignMember } from '../../domain/entities/campaign-member.entity';
import { CampaignMemberRepository } from '../../domain/repositories/campaign-member.repository';
import { CampaignRepository } from '../../domain/repositories/campaign.repository';
import { UserProfileRepository } from '../../../users/domain/repositories/user-profile.repository';
import { CampaignError } from '../errors';

export interface InvitePlayerDto {
  campaignId: string;
  userId: string;
}

export class InvitePlayerUseCase {
  constructor(
    private readonly campaignRepo: CampaignRepository,
    private readonly memberRepo: CampaignMemberRepository,
    private readonly userRepo: UserProfileRepository
  ) {}

  async execute(dto: InvitePlayerDto): Promise<Result<CampaignMember, CampaignError>> {
    try {
      const campaignUuid = UUID.fromString(dto.campaignId);
      
      const campaign = await this.campaignRepo.findById(campaignUuid);
      if (!campaign) {
        return Result.fail(CampaignError.NOT_FOUND);
      }

      const user = await this.userRepo.findById(dto.userId);
      if (!user) {
        return Result.fail(CampaignError.NOT_FOUND); // User not found
      }

      const existing = await this.memberRepo.findByUserAndCampaign(dto.userId, campaignUuid);
      if (existing) {
        return Result.fail(CampaignError.ALREADY_EXISTS); // Or specifically "User already in campaign"
      }

      const member = CampaignMember.create(campaignUuid, dto.userId, 'player');
      await this.memberRepo.save(member);

      return Result.ok(member);
    } catch {
      return Result.fail(CampaignError.NOT_FOUND);
    }
  }
}
