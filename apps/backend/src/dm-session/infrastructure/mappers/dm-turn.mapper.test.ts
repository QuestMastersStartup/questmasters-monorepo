import { describe, expect, it } from 'bun:test';
import { DmTurnMapper } from './dm-turn.mapper';
import { DmTurn } from '../../domain/entities/dm-turn.entity';

function buildTurn(overrides: Partial<Parameters<typeof DmTurn.create>[0]> = {}) {
  return DmTurn.create({
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
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
    ...overrides,
  });
}

describe('DmTurnMapper.toResponse', () => {
  it('caso válido: mapea un turno completo a un objeto plano serializable', () => {
    const turn = buildTurn();
    const response = DmTurnMapper.toResponse(turn);

    expect(response.turnNumber).toBe(1);
    expect(response.role).toBe('dm');
    expect(response.playerInput).toBe('Abro la puerta');
    expect(response.dmResponse).toBe('La puerta cruje y se abre a la oscuridad.');
    expect(response.architectureType).toBe('monolithic');
    expect(typeof response.createdAt).toBe('string');
  });

  it('caso límite: playerInput ausente (turno auto-generado por el sistema) se mantiene null/undefined tal cual', () => {
    const turn = buildTurn({ playerInput: undefined });
    const response = DmTurnMapper.toResponse(turn);

    expect(response.playerInput).toBeFalsy();
  });
});
