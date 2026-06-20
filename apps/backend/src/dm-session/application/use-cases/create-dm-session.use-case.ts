import { Result } from '@shared/application/result';
import {
  ArchitectureType,
  CharacterSnapshot,
  DmSession,
} from '../../domain/entities/dm-session.entity';
import { DmSessionRepository } from '../../domain/repositories/dm-session.repository';
import { DmSessionError } from '../errors';

export interface CreateDmSessionDto {
  userId: string;
  title: string;
  campaignPrompt: string;
  characters: CharacterSnapshot[];
  architectureType: ArchitectureType;
  modelId?: string;
}

export class CreateDmSessionUseCase {
  constructor(private readonly sessionRepo: DmSessionRepository) {}

  async execute(dto: CreateDmSessionDto): Promise<Result<DmSession, DmSessionError>> {
    if (!dto.campaignPrompt || dto.campaignPrompt.trim() === '') {
      return Result.fail(DmSessionError.INVALID_PROMPT);
    }

    const validCharacters = (dto.characters ?? []).filter(
      (c) => c.name?.trim(),
    );
    if (validCharacters.length === 0) {
      return Result.fail(DmSessionError.INVALID_CHARACTERS);
    }

    // No llama al modelo todavía — la sesión nace 'initializing' y el primer
    // turno lo genera InitializeDmSession.
    const session = DmSession.create({
      userId: dto.userId,
      title: dto.title.trim() || 'Sesión sin título',
      campaignPrompt: dto.campaignPrompt.trim(),
      characters: dto.characters,
      architectureType: dto.architectureType,
      modelId: dto.modelId,
    });

    await this.sessionRepo.save(session);

    return Result.ok(session);
  }
}
