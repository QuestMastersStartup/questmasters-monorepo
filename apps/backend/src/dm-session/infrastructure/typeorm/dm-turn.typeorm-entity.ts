import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  type Relation,
} from 'typeorm';
import type { NarrativeNote } from '../../domain/entities/dm-session.entity';

@Entity('dm_turns')
export class DmTurnOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Index()
  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @Column({ name: 'turn_number', type: 'integer' })
  turnNumber: number;

  @Column({ type: 'varchar', length: 10 })
  role: string;

  @Column({ name: 'player_input', type: 'text', nullable: true })
  playerInput: string | null;

  @Column({ name: 'dm_response', type: 'text' })
  dmResponse: string;

  @Column({ name: 'memory_snapshot_after', type: 'jsonb', default: () => "'{}'" })
  memorySnapshotAfter: Record<string, any>;

  @Column({ name: 'narrative_notes_delta', type: 'jsonb', default: () => "'[]'" })
  narrativeNotesDelta: NarrativeNote[];

  @Column({ name: 'input_tokens', type: 'integer', default: 0 })
  inputTokens: number;

  @Column({ name: 'output_tokens', type: 'integer', default: 0 })
  outputTokens: number;

  @Column({ name: 'latency_ms', type: 'integer', default: 0 })
  latencyMs: number;

  @Column({ name: 'model_id', type: 'varchar', length: 100 })
  modelId: string;

  @Column({ name: 'architecture_type', type: 'varchar', length: 20 })
  architectureType: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  // ─── Relations (string-based to avoid circular deps) ─────────────────

  @ManyToOne('DmSessionOrmEntity', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: Relation<any>;
}
