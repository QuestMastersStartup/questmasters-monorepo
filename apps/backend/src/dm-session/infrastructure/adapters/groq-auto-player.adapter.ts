import type { CharacterSnapshot } from '../../domain/entities/dm-session.entity';
import { logger } from '../../../shared/infrastructure/logger';

type AiMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export interface SessionMemory {
  npcs: string[];
  locations: string[];
  events: string[];
}

export interface AutoPlayerContext {
  character: CharacterSnapshot;
  campaignPrompt: string;
  conversationHistory: { role: 'player' | 'dm'; content: string }[];
  lastDmResponse: string;
  sessionMemory?: SessionMemory;
}

export class GeminiAutoPlayerAdapter {
  private readonly model = '@cf/meta/llama-3.2-3b-instruct';

  constructor(private readonly ai: Ai) {}

  async generatePlayerAction(ctx: AutoPlayerContext): Promise<string> {
    const messages = this.buildMessages(ctx);
    return this.callAI(messages, 120, 0.6);
  }

  async extractFacts(dmResponse: string, existing: SessionMemory): Promise<SessionMemory> {
    const messages: AiMessage[] = [
      {
        role: 'system',
        content: [
          'Eres un extractor de información de partidas de D&D.',
          'Dado un texto del DM, extrae PNJs, lugares y eventos clave.',
          'Responde SOLO con JSON válido, sin texto adicional.',
          'Formato: {"npcs":["nombre - descripción breve"],"locations":["nombre - descripción breve"],"events":["evento breve"]}',
          'Si no hay información nueva de alguna categoría, devuelve un array vacío.',
          'No repitas información que ya está en el contexto existente.',
        ].join('\n'),
      },
      {
        role: 'user',
        content: `Contexto existente:\nPNJs: ${existing.npcs.join(', ') || 'ninguno'}\nLugares: ${existing.locations.join(', ') || 'ninguno'}\nEventos: ${existing.events.join(', ') || 'ninguno'}\n\nTexto del DM:\n${dmResponse}`,
      },
    ];

    try {
      const raw = await this.callAI(messages, 200, 0.1);
      const parsed = JSON.parse(raw) as Partial<SessionMemory>;
      return {
        npcs: [...existing.npcs, ...(parsed.npcs ?? [])],
        locations: [...existing.locations, ...(parsed.locations ?? [])],
        events: [...existing.events, ...(parsed.events ?? [])],
      };
    } catch (err) {
      logger.warn('Failed to extract facts from DM response', { error: String(err) });
      return existing;
    }
  }

  private async callAI(messages: AiMessage[], maxTokens: number, temperature: number): Promise<string> {
    const result = await this.ai.run(this.model as Parameters<Ai['run']>[0], {
      messages,
      max_tokens: maxTokens,
      temperature,
    } as never);

    const raw = (result as { response?: unknown }).response;
    const text = (Array.isArray(raw) ? raw.join('') : String(raw ?? '')).trim();
    if (!text) throw new Error('Workers AI returned empty response');
    return text;
  }

  private buildProficiencySection(ch: CharacterSnapshot): string {
    const parts: string[] = [];
    if (ch.skillProficiencies?.length) parts.push(`Competente en: ${ch.skillProficiencies.join(', ')}`);
    if (ch.expertiseSkills?.length) parts.push(`Expertise en: ${ch.expertiseSkills.join(', ')}`);
    if (parts.length === 0) return '';
    return parts.join('. ') + '. Usa tus fortalezas cuando tenga sentido.';
  }

  private buildMemorySection(memory?: SessionMemory): string {
    if (!memory) return '';
    const parts: string[] = [];
    if (memory.npcs.length > 0) parts.push(`PNJs conocidos: ${memory.npcs.join('; ')}`);
    if (memory.locations.length > 0) parts.push(`Lugares visitados: ${memory.locations.join('; ')}`);
    if (memory.events.length > 0) parts.push(`Eventos ocurridos: ${memory.events.join('; ')}`);
    if (parts.length === 0) return '';
    return '\n\nLO QUE TU PERSONAJE SABE (no inventes nada fuera de esto):\n' + parts.join('\n');
  }

  private buildMessages(ctx: AutoPlayerContext): AiMessage[] {
    const { character: ch } = ctx;
    const MAX_RECENT = 6;

    const system = [
      `Eres un jugador de D&D 5e. Juegas como un/a ${ch.race} ${ch.class} de nivel ${ch.level}.`,
      ch.subclass ? `Subclase: ${ch.subclass}.` : '',
      `Trasfondo: ${ch.background}. Alineamiento: ${ch.alignment}.`,
      `Personalidad: ${ch.personalityTraits}`,
      ch.backstory ? `Historia: ${ch.backstory}` : '',
      this.buildProficiencySection(ch),
      '',
      'FORMATO OBLIGATORIO:',
      '- Responde en primera persona: "Examino la puerta." "Le digo: ¿quién eres?"',
      '- Máximo 1-2 oraciones cortas.',
      '- NO uses nombres propios para referirte a ti mismo.',
      '- NO narres en tercera persona.',
      '- NO inventes información que el DM no mencionó.',
      '- NO narres consecuencias. El DM decide qué pasa.',
      this.buildMemorySection(ctx.sessionMemory),
    ].filter(Boolean).join('\n');

    const messages: AiMessage[] = [{ role: 'system', content: system }];

    const recent = ctx.conversationHistory.slice(-MAX_RECENT);
    for (const msg of recent) {
      messages.push({ role: msg.role === 'dm' ? 'user' : 'assistant', content: msg.content });
    }

    if (ctx.lastDmResponse && messages[messages.length - 1]?.role !== 'user') {
      messages.push({ role: 'user', content: ctx.lastDmResponse });
    }

    messages.push({
      role: 'user',
      content: '¿Qué haces? Responde como: "Examino la puerta." o "Me acerco al guardia y le pregunto por el camino."',
    });

    return messages;
  }
}

export { GeminiAutoPlayerAdapter as GroqAutoPlayerAdapter };
