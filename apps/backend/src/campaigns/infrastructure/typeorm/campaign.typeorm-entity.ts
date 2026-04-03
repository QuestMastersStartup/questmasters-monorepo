import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  type Relation,
} from 'typeorm';

@Entity('campaigns')
export class CampaignOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 20, default: 'dnd-5e-2014' })
  system: string;

  @Column({ name: 'cover_image_url', type: 'text', nullable: true })
  coverImageUrl: string | null;

  @Column({ name: 'dm_id', type: 'varchar', length: 255 })
  dmId: string;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string;

  @OneToMany('CampaignInstalledPackOrmEntity', 'campaign')
  installedPacks: Relation<any[]>;

  @OneToMany('CampaignMemberOrmEntity', 'campaign', {
    cascade: true,
  })
  members: Relation<any[]>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
