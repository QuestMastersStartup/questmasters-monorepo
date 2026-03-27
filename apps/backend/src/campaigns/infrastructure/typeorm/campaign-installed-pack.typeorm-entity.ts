import {
  Entity,
  PrimaryColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  type Relation,
} from 'typeorm';

@Entity('campaign_installed_packs')
export class CampaignInstalledPackOrmEntity {
  @PrimaryColumn({ name: 'campaign_id', type: 'uuid' })
  campaignId: string;

  @PrimaryColumn({ name: 'pack_id', type: 'uuid' })
  packId: string;

  @CreateDateColumn({ name: 'installed_at', type: 'timestamptz' })
  installedAt: Date;

  @ManyToOne('CampaignOrmEntity', 'installedPacks', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Relation<any>;
}
