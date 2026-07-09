import { describe, expect, it, mock } from 'bun:test';
import { GetDmSessionUseCase } from './get-dm-session.use-case';
import { DmSession } from '../../domain/entities/dm-session.entity';
import { DmTurn } from '../../domain/entities/dm-turn.entity';
import { DmSessionError } from '../errors';
import { UUID } from '@shared/domain/value-objects/uuid.vo';

function makeSession(overrides: Partial<{ userId: string }> = {}) {
  const id = UUID.generate().toString();
  return DmSession.reconstruct({
    id,
    userId: overrides.userId ?? 'owner-1',
    title: 'La cripta del dragón',
    campaignPrompt: 'Una aventura en las Tierras Salvajes',
    characters: [],
    architectureType: 'monolithic',
    status: 'active',
    modelId: 'fable-5',
    memorySnapshot: {},
    narrativeNotes: [],
    turnCount: 1,
    totalInputTokens: 10,
    totalOutputTokens: 20,
    totalLatencyMs: 500,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
    deletedAt: null,
  });
}

function makeTurn(sessionId: string) {
  return DmTurn.create({
    sessionId,
    turnNumber: 1,
    role: 'dm',
    playerInput: 'Abro la puerta',
    dmResponse: 'La puerta cruje y se abre a la oscuridad.',
    memorySnapshotAfter: {},
    narrativeNotesDelta: [],
    inputTokens: 5,
    outputTokens: 15,
    latencyMs: 400,
    modelId: 'fable-5',
    architectureType: 'monolithic',
  });
}

describe('GetDmSessionUseCase', () => {
  it('caso válido: dueño de la sesión recibe la sesión + turnos', async () => {
    const session = makeSession({ userId: 'user-1' });
    const turns = [makeTurn(session.id.toString())];
    const sessionRepo = { findById: mock(() => Promise.resolve(session)) };
    const turnRepo = { findBySessionId: mock(() => Promise.resolve(turns)) };
    const useCase = new GetDmSessionUseCase(sessionRepo as any, turnRepo as any);

    const result = await useCase.execute({
      sessionId: session.id.toString(),
      userId: 'user-1',
      isAdmin: false,
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.session.id.toString()).toBe(session.id.toString());
    expect(result.value.turns).toEqual(turns);
  });

  it('caso límite: admin puede ver una sesión que no le pertenece', async () => {
    const session = makeSession({ userId: 'other-user' });
    const sessionRepo = { findById: mock(() => Promise.resolve(session)) };
    const turnRepo = { findBySessionId: mock(() => Promise.resolve([])) };
    const useCase = new GetDmSessionUseCase(sessionRepo as any, turnRepo as any);

    const result = await useCase.execute({
      sessionId: session.id.toString(),
      userId: 'admin-1',
      isAdmin: true,
    });

    expect(result.isSuccess).toBe(true);
  });

  it('caso inválido: sesión inexistente devuelve NOT_FOUND', async () => {
    const sessionRepo = { findById: mock(() => Promise.resolve(null)) };
    const turnRepo = { findBySessionId: mock() };
    const useCase = new GetDmSessionUseCase(sessionRepo as any, turnRepo as any);

    const result = await useCase.execute({
      sessionId: UUID.generate().toString(),
      userId: 'user-1',
      isAdmin: false,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(DmSessionError.NOT_FOUND);
    expect(turnRepo.findBySessionId).not.toHaveBeenCalled();
  });

  it('caso inválido: usuario no dueño y no admin recibe UNAUTHORIZED', async () => {
    const session = makeSession({ userId: 'owner-1' });
    const sessionRepo = { findById: mock(() => Promise.resolve(session)) };
    const turnRepo = { findBySessionId: mock() };
    const useCase = new GetDmSessionUseCase(sessionRepo as any, turnRepo as any);

    const result = await useCase.execute({
      sessionId: session.id.toString(),
      userId: 'intruder',
      isAdmin: false,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(DmSessionError.UNAUTHORIZED);
  });
});
