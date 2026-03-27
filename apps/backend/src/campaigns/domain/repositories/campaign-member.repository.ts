import { CampaignMember } from '../entities/campaign-member.entity';
import { UUID } from '@shared/domain/value-objects/uuid.vo';

export interface CampaignMemberRepository {
  save(member: CampaignMember): Promise<void>;
  findById(id: UUID): Promise<CampaignMember | null>;
  findByCampaignId(campaignId: UUID): Promise<CampaignMember[]>;
  findByUserAndCampaign(userId: string, campaignId: UUID): Promise<CampaignMember | null>;
  delete(id: UUID): Promise<void>;
  countMembers(campaignId: UUID): Promise<number>;
}
