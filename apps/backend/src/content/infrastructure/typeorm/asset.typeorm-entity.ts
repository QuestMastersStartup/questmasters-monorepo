import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ContentPackOrmEntity } from './content-pack.typeorm-entity';

@Entity('assets')
@Index('IDX_assets_pack_type_index', ['packId', 'type', 'index'], {
  unique: true,
})
export class AssetOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid', { name: 'pack_id' })
  packId: string;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({ type: 'varchar', length: 255 })
  index: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'jsonb' })
  data: Record<string, unknown>;

  @Column('uuid', { name: 'compatible_with', array: true, default: '{}' })
  compatibleWith: string[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => ContentPackOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pack_id' })
  pack: ContentPackOrmEntity;
}
