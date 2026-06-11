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

export interface SendPlayerTurnDto {
  sessionId: string;
  playerInput: string;
  userId: string;
  isAdmin: boolean;
}

export class SendPlayerTurnUseCase {
  constructor(
    private readonly sessionRepo: DmSessionRepository,
    private readonly turnRepo: DmTurnRepository,
    private readonly modelProviders: Record<ArchitectureType, DmModelProvider>,
  ) {}

  async execute(
    dto: SendPlayerTurnDto,
  ): Promise<Result<AsyncGenerator<DmModelChunk>, DmSessionError>> {
    if (!dto.playerInput || dto.playerInput.trim() === '') {
      return Result.fail(DmSessionError.INVALID_INPUT);
    }

    const session = await this.sessionRepo.findById(UUID.fromString(dto.sessionId));
    if (!session) return Result.fail(DmSessionError.NOT_FOUND);

    if (!session.isOwnedBy(dto.userId) && !dto.isAdmin) {
      return Result.fail(DmSessionError.UNAUTHORIZED);
    }

    if (session.status === 'ended') return Result.fail(DmSessionError.ALREADY_ENDED);
    if (session.status !== 'active') return Result.fail(DmSessionError.NOT_ACTIVE);

    // Historial de conversación a partir de los turnos previos
    const previousTurns = await this.turnRepo.findBySessionId(session.id);
    const conversationHistory: { role: 'player' | 'dm'; content: string }[] = [];
    for (const turn of previousTurns) {
      if (turn.playerInput) {
        conversationHistory.push({ role: 'player', content: turn.playerInput });
      }
      conversationHistory.push({ role: 'dm', content: turn.dmResponse });
    }

    const provider = this.modelProviders[session.architectureType];

    const stream = streamAndPersistTurn({
      session,
      role: 'player',
      request: {
        sessionId: session.id.toString(),
        architectureType: session.architectureType,
        modelId: session.modelId,
        campaignPrompt: session.campaignPrompt,
        characters: session.characters,
        conversationHistory,
        playerInput: dto.playerInput.trim(),
        currentMemorySnapshot: session.memorySnapshot,
      },
      provider,
      sessionRepo: this.sessionRepo,
      turnRepo: this.turnRepo,
    });

    return Result.ok(stream);
  }
}
