import { Campaign } from '../entities/campaign.entity';
import { UUID } from '@shared/domain/value-objects/uuid.vo';

export interface CampaignFilters {
  dmId?: string;
  status?: string;
  system?: string;
}

export interface CampaignRepository {
  save(campaign: Campaign): Promise<void>;
  findById(id: UUID): Promise<Campaign | null>;
  findAll(filters?: CampaignFilters): Promise<Campaign[]>;
  delete(id: UUID): Promise<void>;
  exists(id: UUID): Promise<boolean>;
}

export const CAMPAIGN_REPOSITORY = Symbol('CampaignRepository');
