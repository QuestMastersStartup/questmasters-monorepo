import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  type Relation,
  Index,
} from 'typeorm';
import { UserProfileOrmEntity } from '../../../users/infrastructure/adapters/out/persistence/typeorm/user-profile.typeorm-entity';

@Entity('campaign_members')
@Index(['campaignId', 'userId'], { unique: true })
export class CampaignMemberOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ name: 'campaign_id', type: 'uuid' })
  campaignId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 20, default: 'player' })
  role: 'dm' | 'player';

  @CreateDateColumn({ name: 'joined_at', type: 'timestamptz' })
  joinedAt: Date;

  @ManyToOne('CampaignOrmEntity', 'members', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Relation<any>;

  @ManyToOne(() => UserProfileOrmEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: Relation<UserProfileOrmEntity>;
}
