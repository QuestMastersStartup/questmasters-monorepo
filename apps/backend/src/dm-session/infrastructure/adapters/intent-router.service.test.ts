import { describe, expect, it, mock } from 'bun:test';
import { IntentRouterService } from './intent-router.service';

function makeService(runImpl: (...args: any[]) => Promise<unknown>) {
  const ai = { run: mock(runImpl) };
  return new IntentRouterService(ai as any);
}

describe('IntentRouterService.classify — RN-003 (recuperación de JSON)', () => {
  it('caso válido: JSON bien formado del modelo se parsea tal cual', async () => {
    const service = makeService(async () => ({
      response: '{"needs_memory":false,"needs_arbiter":true,"needs_npc":false,"needs_world":false}',
    }));

    const decision = await service.classify('ataco al goblin', 'Una mazmorra', 1);

    expect(decision).toEqual({
      needs_memory: false,
      needs_arbiter: true,
      needs_npc: false,
      needs_world: false,
    });
  });

  it('caso límite: extrae el JSON aunque el modelo lo rodee de texto extra', async () => {
    const service = makeService(async () => ({
      response:
        'Aquí tienes la clasificación:\n' +
        '{"needs_memory":true,"needs_arbiter":false,"needs_npc":true,"needs_world":false}\n' +
        'Espero que ayude.',
    }));

    const decision = await service.classify('le pregunto al tabernero', 'Una mazmorra', 1);

    expect(decision).toEqual({
      needs_memory: true,
      needs_arbiter: false,
      needs_npc: true,
      needs_world: false,
    });
  });

  it('caso inválido: JSON irrecuperable no lanza — cae a la heurística por keywords', async () => {
    const service = makeService(async () => ({
      response: 'esto no es json en absoluto, lo siento',
    }));

    const decision = await service.classify('ataco al goblin con mi espada', 'Una mazmorra', 1);

    // Sin bloque {...} que extraer, parseJson no puede recuperar nada: cae al fallback
    // por keywords, que sí reconoce "ataco" como necesidad de arbitraje.
    expect(decision).toEqual({
      needs_memory: false,
      needs_arbiter: true,
      needs_npc: false,
      needs_world: false,
    });
  });
});
