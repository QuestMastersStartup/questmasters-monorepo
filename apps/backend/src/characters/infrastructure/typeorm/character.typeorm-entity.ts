import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  type Relation,
} from 'typeorm';

@Entity('characters')
export class CharacterOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ name: 'campaign_id', type: 'uuid', nullable: true })
  campaignId: string | null;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ name: 'race_asset_id', type: 'uuid', nullable: true })
  raceAssetId: string | null;

  @Column({ name: 'class_asset_id', type: 'uuid', nullable: true })
  classAssetId: string | null;

  @Column({ name: 'background_asset_id', type: 'uuid', nullable: true })
  backgroundAssetId: string | null;

  @Column({ type: 'integer', default: 1 })
  level: number;

  @Column({ type: 'jsonb' })
  stats: Record<string, number>;

  @Column({ name: 'hit_points', type: 'integer' })
  hitPoints: number;

  @Column({ name: 'portrait_url', type: 'text', nullable: true })
  portraitUrl: string | null;

  @Column({ type: 'text', nullable: true })
  backstory: string | null;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  @Column({ type: 'jsonb', nullable: true })
  choices: Record<string, any> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // ─── Relations (string-based to avoid circular deps) ─────────────────

  @ManyToOne('CampaignOrmEntity', {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Relation<any>;

  @ManyToOne('UserProfileOrmEntity', {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: Relation<any>;

  @ManyToOne('AssetOrmEntity', { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'race_asset_id' })
  raceAsset: Relation<any>;

  @ManyToOne('AssetOrmEntity', { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'class_asset_id' })
  classAsset: Relation<any>;

  @ManyToOne('AssetOrmEntity', {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'background_asset_id' })
  backgroundAsset: Relation<any>;
}
