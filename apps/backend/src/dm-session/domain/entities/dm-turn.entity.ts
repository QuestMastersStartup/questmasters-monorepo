import { UUID } from '@shared/domain/value-objects/uuid.vo';
import type { ArchitectureType, NarrativeNote } from './dm-session.entity';

export type DmTurnRole = 'player' | 'dm';

export interface CreateDmTurnProps {
  sessionId: string;
  turnNumber: number;
  role: DmTurnRole;
  /** null si es la narración inicial del DM. */
  playerInput: string | null;
  dmResponse: string;
  memorySnapshotAfter: Record<string, any>;
  narrativeNotesDelta: NarrativeNote[];
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  modelId: string;
  architectureType: ArchitectureType;
}

export interface ReconstructDmTurnProps extends CreateDmTurnProps {
  id: string;
  createdAt: Date;
}

export class DmTurn {
  private constructor(
    public readonly id: UUID,
    public readonly sessionId: UUID,
    public readonly turnNumber: number,
    public readonly role: DmTurnRole,
    public readonly playerInput: string | null,
    public readonly dmResponse: string,
    public readonly memorySnapshotAfter: Record<string, any>,
    public readonly narrativeNotesDelta: NarrativeNote[],
    public readonly inputTokens: number,
    public readonly outputTokens: number,
    public readonly latencyMs: number,
    public readonly modelId: string,
    public readonly architectureType: ArchitectureType,
    public readonly createdAt: Date,
  ) {}

  static create(props: CreateDmTurnProps): DmTurn {
    return new DmTurn(
      UUID.generate(),
      UUID.fromString(props.sessionId),
      props.turnNumber,
      props.role,
      props.playerInput,
      props.dmResponse,
      props.memorySnapshotAfter,
      props.narrativeNotesDelta,
      props.inputTokens,
      props.outputTokens,
      props.latencyMs,
      props.modelId,
      props.architectureType,
      new Date(),
    );
  }

  static reconstruct(props: ReconstructDmTurnProps): DmTurn {
    return new DmTurn(
      UUID.fromString(props.id),
      UUID.fromString(props.sessionId),
      props.turnNumber,
      props.role,
      props.playerInput,
      props.dmResponse,
      props.memorySnapshotAfter,
      props.narrativeNotesDelta,
      props.inputTokens,
      props.outputTokens,
      props.latencyMs,
      props.modelId,
      props.architectureType,
      props.createdAt,
    );
  }
}
