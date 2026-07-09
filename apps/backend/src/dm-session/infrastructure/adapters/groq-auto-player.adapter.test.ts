import { describe, expect, it, mock } from 'bun:test';
import { GeminiAutoPlayerAdapter } from './groq-auto-player.adapter';
import type { CharacterSnapshot } from '../../domain/entities/dm-session.entity';

const character: CharacterSnapshot = {
  name: 'Kaelen',
  race: 'Elfo',
  class: 'Explorador',
  background: 'Forastero',
  level: 3,
  backstory: 'Creció en el bosque de Silverwood.',
  alignment: 'Neutral Bueno',
  personalityTraits: 'Cauteloso y observador',
};

function makeAdapter(runImpl: (...args: any[]) => Promise<unknown>) {
  const ai = { run: mock(runImpl) };
  return { adapter: new GeminiAutoPlayerAdapter(ai as any), ai };
}

describe('GeminiAutoPlayerAdapter.generatePlayerAction', () => {
  it('caso válido: devuelve el texto generado por el modelo, recortado', async () => {
    const { adapter } = makeAdapter(async () => ({ response: '  Desenvaino mi espada y avanzo.  ' }));

    const action = await adapter.generatePlayerAction({
      character,
      campaignPrompt: 'Una mazmorra olvidada',
      conversationHistory: [],
      lastDmResponse: 'Ves una puerta de piedra ante ti.',
    });

    expect(action).toBe('Desenvaino mi espada y avanzo.');
  });

  it('caso límite: respuesta vacía del modelo rechaza con mensaje explícito', async () => {
    const { adapter } = makeAdapter(async () => ({ response: [] }));

    await expect(
      adapter.generatePlayerAction({
        character,
        campaignPrompt: 'Una mazmorra olvidada',
        conversationHistory: [],
        lastDmResponse: '',
      }),
    ).rejects.toThrow('Workers AI returned empty response');
  });

  it('caso inválido: fallo del binding de IA se propaga', async () => {
    const { adapter } = makeAdapter(async () => {
      throw new Error('Workers AI timeout');
    });

    await expect(
      adapter.generatePlayerAction({
        character,
        campaignPrompt: 'Una mazmorra olvidada',
        conversationHistory: [],
        lastDmResponse: '',
      }),
    ).rejects.toThrow('Workers AI timeout');
  });

  it('contrato: el contexto del personaje viaja en el prompt del sistema', async () => {
    const { adapter, ai } = makeAdapter(async () => ({ response: 'Avanzo con cautela.' }));

    await adapter.generatePlayerAction({
      character,
      campaignPrompt: 'Una mazmorra olvidada',
      conversationHistory: [],
      lastDmResponse: '',
    });

    const callArgs = ai.run.mock.calls[0][1] as { messages: { role: string; content: string }[] };
    const systemMessage = callArgs.messages.find((m) => m.role === 'system');
    expect(systemMessage?.content).toContain('Elfo');
    expect(systemMessage?.content).toContain('Explorador');
  });
});
