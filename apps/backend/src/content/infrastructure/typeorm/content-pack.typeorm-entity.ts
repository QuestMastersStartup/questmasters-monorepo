import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('content_packs')
export class ContentPackOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true, length: 255 })
  slug: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, default: '1.0.0' })
  version: string;

  @Column({ type: 'varchar', length: 20 })
  type: string;

  @Column({ type: 'varchar', length: 20, default: 'dnd-5e-2014' })
  system: string;

  @Column({ name: 'creator_id', type: 'varchar', length: 255, nullable: true })
  creatorId: string;

  @Column('uuid', { array: true, default: '{}' })
  dependencies: string[];

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'is_suspended', type: 'boolean', default: false })
  isSuspended: boolean;

  @Column({ name: 'suspension_reason', type: 'text', nullable: true })
  suspensionReason: string | null;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
