import { describe, expect, it, mock } from 'bun:test';
import { GetSessionMetricsUseCase } from './get-session-metrics.use-case';
import { DmSession } from '../../domain/entities/dm-session.entity';
import { DmSessionError } from '../errors';
import { UUID } from '@shared/domain/value-objects/uuid.vo';

function makeSession(overrides: Partial<{ turnCount: number; totalLatencyMs: number }> = {}) {
  const id = UUID.generate().toString();
  return DmSession.reconstruct({
    id,
    userId: 'owner-1',
    title: 'La cripta del dragón',
    campaignPrompt: 'Una aventura en las Tierras Salvajes',
    characters: [],
    architectureType: 'monolithic',
    status: 'active',
    modelId: 'gemma-4-26B-A4B-it',
    memorySnapshot: {},
    narrativeNotes: [],
    turnCount: overrides.turnCount ?? 0,
    totalInputTokens: 100,
    totalOutputTokens: 200,
    totalLatencyMs: overrides.totalLatencyMs ?? 0,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
    deletedAt: null,
  });
}

describe('GetSessionMetricsUseCase — RN-002 (cálculo de latencia)', () => {
  it('caso límite: sesión sin turnos reporta avgLatencyMs = 0 (sin división por cero)', async () => {
    const session = makeSession({ turnCount: 0, totalLatencyMs: 0 });
    const sessionRepo = { findById: mock(() => Promise.resolve(session)) };
    const turnRepo = { findBySessionId: mock(() => Promise.resolve([])) };
    const useCase = new GetSessionMetricsUseCase(sessionRepo as any, turnRepo as any);

    const result = await useCase.execute({
      sessionId: session.id.toString(),
      userId: 'admin-1',
      isAdmin: true,
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.avgLatencyMs).toBe(0);
  });

  it('caso válido: promedia la latencia total entre el número de turnos', async () => {
    const session = makeSession({ turnCount: 4, totalLatencyMs: 10000 });
    const sessionRepo = { findById: mock(() => Promise.resolve(session)) };
    const turnRepo = { findBySessionId: mock(() => Promise.resolve([])) };
    const useCase = new GetSessionMetricsUseCase(sessionRepo as any, turnRepo as any);

    const result = await useCase.execute({
      sessionId: session.id.toString(),
      userId: 'admin-1',
      isAdmin: true,
    });

    expect(result.isSuccess).toBe(true);
    expect(result.value.avgLatencyMs).toBe(2500);
    expect(result.value.totalLatencyMs).toBe(10000);
    expect(result.value.turnCount).toBe(4);
  });

  it('caso inválido: solicitante no admin recibe UNAUTHORIZED sin consultar los repositorios', async () => {
    const session = makeSession({ turnCount: 2, totalLatencyMs: 4000 });
    const sessionRepo = { findById: mock(() => Promise.resolve(session)) };
    const turnRepo = { findBySessionId: mock() };
    const useCase = new GetSessionMetricsUseCase(sessionRepo as any, turnRepo as any);

    const result = await useCase.execute({
      sessionId: session.id.toString(),
      userId: 'user-1',
      isAdmin: false,
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBe(DmSessionError.UNAUTHORIZED);
    expect(sessionRepo.findById).not.toHaveBeenCalled();
    expect(turnRepo.findBySessionId).not.toHaveBeenCalled();
  });
});
