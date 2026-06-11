import { UUID } from '@shared/domain/value-objects/uuid.vo';

export type ArchitectureType = 'mas' | 'monolithic';

export type DmSessionStatus = 'initializing' | 'active' | 'paused' | 'ended';

export interface CharacterSnapshot {
  name: string;
  race: string;
  class: string;
  background: string;
  /** Texto libre con personalidad, historia, motivaciones. */
  description: string;
}

export interface NarrativeNote {
  type: 'tension' | 'coherence' | 'plot_thread' | 'warning';
  content: string;
  turn: number;
  /** ISO 8601 — viaja por JSON (SSE + jsonb), nunca como Date real. */
  timestamp: string;
}

export interface CreateDmSessionProps {
  userId: string;
  title: string;
  campaignPrompt: string;
  characters: CharacterSnapshot[];
  architectureType: ArchitectureType;
  modelId?: string;
}

export interface ReconstructDmSessionProps {
  id: string;
  userId: string;
  title: string;
  campaignPrompt: string;
  characters: CharacterSnapshot[];
  architectureType: ArchitectureType;
  status: DmSessionStatus;
  modelId: string;
  memorySnapshot: Record<string, any>;
  narrativeNotes: NarrativeNote[];
  turnCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalLatencyMs: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Resultado de un turno aplicado a la sesión (deltas que llegan del modelo). */
export interface TurnOutcome {
  memorySnapshot: Record<string, any>;
  narrativeNotesDelta: NarrativeNote[];
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

export class DmSession {
  private constructor(
    public readonly id: UUID,
    public readonly userId: string,
    public readonly title: string,
    public readonly campaignPrompt: string,
    public readonly characters: CharacterSnapshot[],
    public readonly architectureType: ArchitectureType,
    public readonly status: DmSessionStatus,
    public readonly modelId: string,
    public readonly memorySnapshot: Record<string, any>,
    public readonly narrativeNotes: NarrativeNote[],
    public readonly turnCount: number,
    public readonly totalInputTokens: number,
    public readonly totalOutputTokens: number,
    public readonly totalLatencyMs: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(props: CreateDmSessionProps): DmSession {
    return new DmSession(
      UUID.generate(),
      props.userId,
      props.title,
      props.campaignPrompt,
      props.characters,
      props.architectureType,
      'initializing',
      props.modelId ?? 'fable-5',
      {},
      [],
      0,
      0,
      0,
      0,
      new Date(),
      new Date(),
    );
  }

  static reconstruct(props: ReconstructDmSessionProps): DmSession {
    return new DmSession(
      UUID.fromString(props.id),
      props.userId,
      props.title,
      props.campaignPrompt,
      props.characters,
      props.architectureType,
      props.status,
      props.modelId,
      props.memorySnapshot,
      props.narrativeNotes,
      props.turnCount,
      props.totalInputTokens,
      props.totalOutputTokens,
      props.totalLatencyMs,
      props.createdAt,
      props.updatedAt,
    );
  }

  /** Aplica el resultado de un turno: acumula memoria, notas y contadores. */
  applyTurn(outcome: TurnOutcome): DmSession {
    return new DmSession(
      this.id,
      this.userId,
      this.title,
      this.campaignPrompt,
      this.characters,
      this.architectureType,
      this.status === 'initializing' ? 'active' : this.status,
      this.modelId,
      outcome.memorySnapshot,
      [...this.narrativeNotes, ...outcome.narrativeNotesDelta],
      this.turnCount + 1,
      this.totalInputTokens + outcome.inputTokens,
      this.totalOutputTokens + outcome.outputTokens,
      this.totalLatencyMs + outcome.latencyMs,
      this.createdAt,
      new Date(),
    );
  }

  changeStatus(status: DmSessionStatus): DmSession {
    return new DmSession(
      this.id,
      this.userId,
      this.title,
      this.campaignPrompt,
      this.characters,
      this.architectureType,
      status,
      this.modelId,
      this.memorySnapshot,
      this.narrativeNotes,
      this.turnCount,
      this.totalInputTokens,
      this.totalOutputTokens,
      this.totalLatencyMs,
      this.createdAt,
      new Date(),
    );
  }

  end(): DmSession {
    return this.changeStatus('ended');
  }

  isOwnedBy(userId: string): boolean {
    return this.userId === userId;
  }
}
