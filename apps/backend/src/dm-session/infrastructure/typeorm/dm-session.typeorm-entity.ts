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
import type {
  CharacterSnapshot,
  NarrativeNote,
} from '../../domain/entities/dm-session.entity';

@Entity('dm_sessions')
export class DmSessionOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 150 })
  title: string;

  @Column({ name: 'campaign_prompt', type: 'text' })
  campaignPrompt: string;

  @Column({ type: 'jsonb' })
  characters: CharacterSnapshot[];

  @Column({ name: 'architecture_type', type: 'varchar', length: 20 })
  architectureType: string;

  @Column({ type: 'varchar', length: 20, default: 'initializing' })
  status: string;

  @Column({ name: 'model_id', type: 'varchar', length: 100 })
  modelId: string;

  @Column({ name: 'memory_snapshot', type: 'jsonb', default: () => "'{}'" })
  memorySnapshot: Record<string, any>;

  @Column({ name: 'narrative_notes', type: 'jsonb', default: () => "'[]'" })
  narrativeNotes: NarrativeNote[];

  @Column({ name: 'turn_count', type: 'integer', default: 0 })
  turnCount: number;

  @Column({ name: 'total_input_tokens', type: 'integer', default: 0 })
  totalInputTokens: number;

  @Column({ name: 'total_output_tokens', type: 'integer', default: 0 })
  totalOutputTokens: number;

  @Column({ name: 'total_latency_ms', type: 'integer', default: 0 })
  totalLatencyMs: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // ─── Relations (string-based to avoid circular deps) ─────────────────

  @ManyToOne('UserProfileOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<any>;
}
