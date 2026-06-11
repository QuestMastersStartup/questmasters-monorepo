import { UUID } from '@shared/domain/value-objects/uuid.vo';
import { Result } from '@shared/application/result';
import type { ArchitectureType } from '../../domain/entities/dm-session.entity';
import { DmSessionRepository } from '../../domain/repositories/dm-session.repository';
import { DmTurnRepository } from '../../domain/repositories/dm-turn.repository';
import type {
  DmModelChunk,
  DmModelProvider,
} from '../../domain/ports/dm-model.provider';
import { DmSessionError } from '../errors';
import { streamAndPersistTurn } from '../stream-turn';

export interface InitializeDmSessionDto {
  sessionId: string;
  userId: string;
  isAdmin: boolean;
}

/**
 * Genera el turno inicial del DM (apertura narrativa) llamando al modelo con
 * playerInput=null. Devuelve el generador de chunks para que la ruta lo
 * streamee por SSE; al recibir metadata persiste el turno y activa la sesión.
 */
export class InitializeDmSessionUseCase {
  constructor(
    private readonly sessionRepo: DmSessionRepository,
    private readonly turnRepo: DmTurnRepository,
    private readonly modelProviders: Record<ArchitectureType, DmModelProvider>,
  ) {}

  async execute(
    dto: InitializeDmSessionDto,
  ): Promise<Result<AsyncGenerator<DmModelChunk>, DmSessionError>> {
    const session = await this.sessionRepo.findById(UUID.fromString(dto.sessionId));
    if (!session) return Result.fail(DmSessionError.NOT_FOUND);

    if (!session.isOwnedBy(dto.userId) && !dto.isAdmin) {
      return Result.fail(DmSessionError.UNAUTHORIZED);
    }

    if (session.status !== 'initializing') {
      return Result.fail(DmSessionError.NOT_INITIALIZING);
    }

    const provider = this.modelProviders[session.architectureType];

    const stream = streamAndPersistTurn({
      session,
      role: 'dm',
      request: {
        sessionId: session.id.toString(),
        architectureType: session.architectureType,
        modelId: session.modelId,
        campaignPrompt: session.campaignPrompt,
        characters: session.characters,
        conversationHistory: [],
        playerInput: null,
        currentMemorySnapshot: session.memorySnapshot,
      },
      provider,
      sessionRepo: this.sessionRepo,
      turnRepo: this.turnRepo,
    });

    return Result.ok(stream);
  }
}
