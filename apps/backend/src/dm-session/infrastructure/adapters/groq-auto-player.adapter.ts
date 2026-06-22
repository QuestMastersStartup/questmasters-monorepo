import type { CharacterSnapshot } from '../../domain/entities/dm-session.entity';
import { logger } from '../../../shared/infrastructure/logger';

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GroqResponse {
  choices: { message: { content: string } }[];
}

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

export class GroqAutoPlayerAdapter {
  private readonly baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
  private readonly model = 'llama-3.1-8b-instant';

  constructor(private readonly apiKey: string) {}

  async generatePlayerAction(ctx: AutoPlayerContext): Promise<string> {
    const messages = this.buildMessages(ctx);
    return this.callGroq(messages, 120, 0.6);
  }

  async extractFacts(dmResponse: string, existing: SessionMemory): Promise<SessionMemory> {
    const messages: GroqMessage[] = [
      {
        role: 'system',
        content: [
          'Eres un extractor de información de partidas de D&D.',
          'Dado un texto del DM, extrae PNJs, lugares y eventos clave.',
          'Responde SOLO con JSON válido, sin texto adicional.',
          'Formato: {"npcs":["nombre - descripción breve"],"locations":["nombre - descripción breve"],"events":["evento breve"]}',
          'Si no hay información nueva de alguna categoría, devuelve un array vacío para esa categoría.',
          'No repitas información que ya está en el contexto existente.',
        ].join('\n'),
      },
      {
        role: 'user',
        content: `Contexto existente:\nPNJs: ${existing.npcs.join(', ') || 'ninguno'}\nLugares: ${existing.locations.join(', ') || 'ninguno'}\nEventos: ${existing.events.join(', ') || 'ninguno'}\n\nTexto del DM:\n${dmResponse}`,
      },
    ];

    try {
      const raw = await this.callGroq(messages, 200, 0.1);
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

  private async callGroq(messages: GroqMessage[], maxTokens: number, temperature: number): Promise<string> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      const err = await response.text().catch(() => '');
      logger.error('Groq request failed', {
        status: response.status,
        body: err.slice(0, 300),
      });
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = (await response.json()) as GroqResponse;
    const content = data.choices[0]?.message?.content?.trim();

    if (!content) {
      throw new Error('Groq returned empty response');
    }

    return content;
  }

  private buildProficiencySection(ch: CharacterSnapshot): string {
    const parts: string[] = [];
    if (ch.skillProficiencies?.length) {
      parts.push(`Competente en: ${ch.skillProficiencies.join(', ')}`);
    }
    if (ch.expertiseSkills?.length) {
      parts.push(`Expertise en: ${ch.expertiseSkills.join(', ')}`);
    }
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

  private buildMessages(ctx: AutoPlayerContext): GroqMessage[] {
    const { character: ch } = ctx;
    const MAX_RECENT = 20;

    const memorySection = this.buildMemorySection(ctx.sessionMemory);

    const profSection = this.buildProficiencySection(ch);

    const system = [
      `Eres ${ch.name}, un/a ${ch.race} ${ch.class} de nivel ${ch.level}.`,
      ch.subclass ? `Subclase: ${ch.subclass}.` : '',
      `Trasfondo: ${ch.background}. Alineamiento: ${ch.alignment}.`,
      `Personalidad: ${ch.personalityTraits}`,
      ch.backstory ? `Historia: ${ch.backstory}` : '',
      profSection,
      '',
      'REGLAS ESTRICTAS:',
      '- Responde SIEMPRE en primera persona como tu personaje.',
      '- Máximo 1-2 oraciones cortas y directas.',
      '- Describe SOLO tu acción o diálogo. NO narres pensamientos internos, sensaciones ni monólogos.',
      '- NO inventes hechos, personas, conversaciones ni eventos que el DM no haya mencionado.',
      '- Solo reacciona a lo que el DM describió en su último mensaje.',
      '- NO narres consecuencias de tu acción. El DM decide qué pasa.',
      '- Si el DM te presenta opciones o alternativas, elige UNA basándote en tu personalidad.',
      '- Si el DM te hace una pregunta directa, respóndela en personaje.',
      '- Habla como un jugador de D&D real, no como un novelista.',
      memorySection,
    ].filter(Boolean).join('\n');

    const messages: GroqMessage[] = [{ role: 'system', content: system }];

    const recent = ctx.conversationHistory.slice(-MAX_RECENT);
    for (const msg of recent) {
      messages.push({
        role: msg.role === 'player' ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    if (ctx.lastDmResponse && messages[messages.length - 1]?.role !== 'assistant') {
      messages.push({ role: 'assistant', content: ctx.lastDmResponse });
    }

    messages.push({
      role: 'user',
      content: '¿Qué hace tu personaje? Responde con una acción corta en primera persona. No inventes información nueva.',
    });

    return messages;
  }
}
