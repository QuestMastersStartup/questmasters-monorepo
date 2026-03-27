import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { UserProfile } from '../../../users/domain/entities/user-profile.entity';

export interface CampaignMemberProps {
  id: UUID;
  campaignId: UUID;
  userId: string; // The UUID string from user_profiles.id (matches Supabase Auth)
  role: 'dm' | 'player';
  joinedAt: Date;
  user?: UserProfile;
}

export class CampaignMember {
  private constructor(private readonly props: CampaignMemberProps) {}

  public static create(campaignId: UUID, userId: string, role: 'dm' | 'player' = 'player'): CampaignMember {
    return new CampaignMember({
      id: UUID.generate(),
      campaignId,
      userId,
      role,
      joinedAt: new Date(),
    });
  }

  public static reconstruct(props: CampaignMemberProps): CampaignMember {
    return new CampaignMember(props);
  }

  public get id(): UUID {
    return this.props.id;
  }

  public get campaignId(): UUID {
    return this.props.campaignId;
  }

  public get userId(): string {
    return this.props.userId;
  }

  public get role(): 'dm' | 'player' {
    return this.props.role;
  }

  public get joinedAt(): Date {
    return this.props.joinedAt;
  }

  public get user(): UserProfile | undefined {
    return this.props.user;
  }

  public toObject(): CampaignMemberProps {
    return { ...this.props };
  }
}
