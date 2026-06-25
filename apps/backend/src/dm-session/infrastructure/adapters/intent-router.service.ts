import { logger } from '../../../shared/infrastructure/logger';

export interface RouteDecision {
  needs_memory: boolean;
  needs_arbiter: boolean;
  needs_npc: boolean;
  needs_world: boolean;
}

const ROUTER_SYSTEM = [
  'Eres un clasificador de intenciones para una mesa de D&D 5e.',
  'Dado el input del jugador, determina qué agentes necesitan participar.\n',
  'Agentes:',
  '- memory: recuperar recuerdos de turnos anteriores. Necesario cuando se referencia el pasado o hay suficiente historial.',
  '- arbiter: consultar reglas SRD. Necesario para combate, magia, tiradas, habilidades, o incoherencias lógicas.',
  '- npc: reacciones de PNJs. Necesario cuando el jugador interactúa con alguien o hay PNJs presentes.',
  '- world: cambios en el mundo. Necesario cuando la acción altera el entorno.\n',
  'Responde SOLO JSON: {"needs_memory": bool, "needs_arbiter": bool, "needs_npc": bool, "needs_world": bool}',
].join('\n');

const MODEL = '@cf/meta/llama-3.2-3b-instruct';
const MIN_TURNS_FOR_AUTO_MEMORY = 3;

const ARBITER_KW = /ataco|golpeo|lanzo|hechizo|conjuro|intento|escalo|salto|fuerzo|empujo|escondo|examino|investigo|busco|tirada|dado|teléfono|celular|pistola|computadora/i;
const NPC_KW = /hablo|digo|pregunto|convenzo|persuado|intimido|engaño|negocio|amenazo|saludo|pido|le digo|le pregunto|respondo/i;
const WORLD_KW = /destruyo|incendio|quemo|rompo|mato|robo|saqueo|viajo|camino|corro|huyo|escapo|salgo|entro|exploro|espero|descanso|duermo/i;
const MEMORY_KW = /recuerdo|antes|previamente|mencionó|dijo|hizo|anterior/i;

function keywordFallback(playerInput: string, turnCount: number): RouteDecision {
  return {
    needs_memory: turnCount >= MIN_TURNS_FOR_AUTO_MEMORY || MEMORY_KW.test(playerInput),
    needs_arbiter: ARBITER_KW.test(playerInput),
    needs_npc: NPC_KW.test(playerInput),
    needs_world: WORLD_KW.test(playerInput),
  };
}

function parseJson(raw: string): RouteDecision | null {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}') + 1;
  if (start === -1 || end === 0) return null;
  try {
    const parsed = JSON.parse(raw.slice(start, end)) as Record<string, unknown>;
    return {
      needs_memory: Boolean(parsed.needs_memory),
      needs_arbiter: Boolean(parsed.needs_arbiter),
      needs_npc: Boolean(parsed.needs_npc),
      needs_world: Boolean(parsed.needs_world),
    };
  } catch {
    return null;
  }
}

export class IntentRouterService {
  constructor(private readonly ai: Ai) {}

  async classify(
    playerInput: string,
    campaignPrompt: string,
    turnCount: number,
  ): Promise<RouteDecision> {
    try {
      return await this.classifyWithWorkersAI(playerInput, campaignPrompt, turnCount);
    } catch (err) {
      logger.warn('Workers AI router failed, using keyword fallback', { error: String(err) });
    }

    return keywordFallback(playerInput, turnCount);
  }

  private async classifyWithWorkersAI(
    playerInput: string,
    campaignPrompt: string,
    turnCount: number,
  ): Promise<RouteDecision> {
    const userPrompt = `Campaña: ${campaignPrompt}\nTurno: ${turnCount}\nJugador: ${playerInput}`;

    const result = await this.ai.run(MODEL as Parameters<Ai['run']>[0], {
      messages: [
        { role: 'system', content: ROUTER_SYSTEM },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 64,
      temperature: 0,
    } as never);

    const raw = (result as { response?: unknown }).response;
    const text = (Array.isArray(raw) ? raw.join('') : String(raw ?? '')).trim();

    if (!text) throw new Error('Workers AI returned empty response');

    const parsed = parseJson(text);
    if (!parsed) throw new Error(`Workers AI returned unparseable JSON: ${text.slice(0, 100)}`);

    if (turnCount >= MIN_TURNS_FOR_AUTO_MEMORY) {
      parsed.needs_memory = true;
    }

    return parsed;
  }
}
