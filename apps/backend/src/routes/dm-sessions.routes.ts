import { Hono } from 'hono';
import type { CloudflareBindings } from '../types/bindings';
import type { Container } from '../infrastructure/container';
import { requireUser } from '../infrastructure/auth/guards';
import { DmSessionMapper } from '../dm-session/infrastructure/mappers/dm-session.mapper';
import { DmTurnMapper } from '../dm-session/infrastructure/mappers/dm-turn.mapper';
import { DmSessionError } from '../dm-session/application/errors';
import type { DmModelChunk } from '../dm-session/domain/ports/dm-model.provider';
import type { GroqAutoPlayerAdapter, SessionMemory } from '../dm-session/infrastructure/adapters/groq-auto-player.adapter';
import { parseSkillCheck, autoRollSkillCheck } from '../dm-session/infrastructure/utils/dice-roll';
import { logger } from '../shared/infrastructure/logger';

function errorToStatus(error: DmSessionError): number {
  switch (error) {
    case DmSessionError.NOT_FOUND:
      return 404;
    case DmSessionError.UNAUTHORIZED:
      return 403;
    case DmSessionError.INVALID_PROMPT:
    case DmSessionError.INVALID_CHARACTERS:
    case DmSessionError.INVALID_INPUT:
      return 400;
    case DmSessionError.NOT_INITIALIZING:
    case DmSessionError.NOT_ACTIVE:
    case DmSessionError.ALREADY_ENDED:
    case DmSessionError.ALREADY_DELETED:
      return 409;
    default:
      return 500;
  }
}

function errorToMessage(error: DmSessionError): string {
  switch (error) {
    case DmSessionError.INVALID_CHARACTERS: return 'El personaje seleccionado no es válido o no tiene nombre';
    case DmSessionError.INVALID_PROMPT: return 'El prompt de campaña es requerido';
    case DmSessionError.NOT_FOUND: return 'Sesión no encontrada';
    case DmSessionError.UNAUTHORIZED: return 'No tienes permiso para esta sesión';
    case DmSessionError.NOT_INITIALIZING: return 'La sesión no está en estado de inicialización';
    case DmSessionError.NOT_ACTIVE: return 'La sesión no está activa';
    case DmSessionError.ALREADY_ENDED: return 'La sesión ya finalizó';
    case DmSessionError.ALREADY_DELETED: return 'La sesión ya fue eliminada';
    default: return 'Error interno del servidor';
  }
}

const encoder = new TextEncoder();

function sseEncode(payload: unknown): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
}

function sseResponse(
  generator: AsyncGenerator<DmModelChunk>,
  prelude: unknown[] = [],
): Response {
  return new Response(
    new ReadableStream({
      async start(controller) {
        try {
          for (const event of prelude) {
            controller.enqueue(sseEncode(event));
          }
          for await (const chunk of generator) {
            controller.enqueue(sseEncode(chunk));
            if (chunk.type === 'done' || chunk.type === 'error') break;
          }
        } catch {
          controller.enqueue(sseEncode({ type: 'error', error: 'Stream failed' }));
        } finally {
          controller.close();
        }
      },
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    },
  );
}

const FALLBACK_ACTIONS = [
  (name: string) => `${name} observa la escena con atención, buscando detalles que otros pasarían por alto.`,
  (name: string) => `${name} se acerca con cautela a lo más interesante que ve.`,
  (name: string) => `${name} revisa sus pertenencias y se prepara para lo que venga.`,
  (name: string) => `${name} intenta escuchar conversaciones cercanas o sonidos inusuales.`,
  (name: string) => `${name} busca una posición estratégica desde donde evaluar la situación.`,
  (_name: string) => 'Me acerco a la persona más cercana. "Disculpa, ¿qué está pasando aquí?"',
  (_name: string) => 'Examino el terreno con cuidado, buscando pistas o caminos ocultos.',
  (_name: string) => 'Me detengo un momento y observo los alrededores. Algo no me da buena espina.',
  (_name: string) => 'Reviso mi equipo y avanzo con cautela hacia lo que más llama mi atención.',
  (_name: string) => 'Me agacho y examino el suelo. "Veamos qué nos dice este lugar."',
];

function randomFallbackAction(characterName: string): string {
  const fn = FALLBACK_ACTIONS[Math.floor(Math.random() * FALLBACK_ACTIONS.length)];
  return fn(characterName);
}

export function dmSessionsRoutes(container: Container, autoPlayer: GroqAutoPlayerAdapter | null) {
  async function getIsAdmin(userId: string): Promise<boolean> {
    const profile = await container.getUserProfileUseCase.execute(userId);
    return profile.isAdmin;
  }

  const app = new Hono<{ Bindings: CloudflareBindings }>();

  app.get('/', async (c) => {
    const user = await requireUser(c);
    const isAdmin = await getIsAdmin(user.id);

    const result = await container.listDmSessionsUseCase.execute({ userId: user.id, isAdmin });

    if (result.isFailure) {
      return c.json({ message: errorToMessage(result.error) }, errorToStatus(result.error) as any as any);
    }

    return c.json(result.value.map(DmSessionMapper.toSummaryResponse));
  });

  app.post('/', async (c) => {
    const user = await requireUser(c);
    const isAdmin = await getIsAdmin(user.id);
    const body = await c.req.json();
    console.log('[dm-session POST] chars:', body?.characters?.length, 'first_name:', body?.characters?.[0]?.name);

    const created = await container.createDmSessionUseCase.execute({
      userId: user.id,
      title: body.title,
      campaignPrompt: body.campaignPrompt,
      characters: body.characters,
      architectureType: body.architectureType,
      modelId: body.modelId,
    });

    if (created.isFailure) {
      return c.json({ message: errorToMessage(created.error) }, errorToStatus(created.error) as any);
    }

    const session = created.value;

    const initialized = await container.initializeDmSessionUseCase.execute({
      sessionId: session.id.toString(),
      userId: user.id,
      isAdmin,
    });

    if (initialized.isFailure) {
      return c.json({ message: errorToMessage(initialized.error) }, errorToStatus(initialized.error) as any);
    }

    return sseResponse(initialized.value, [
      { type: 'session', session: DmSessionMapper.toResponse(session) },
    ]);
  });

  app.post('/:id/initialize', async (c) => {
    const user = await requireUser(c);
    const isAdmin = await getIsAdmin(user.id);
    const id = c.req.param('id');

    const initialized = await container.initializeDmSessionUseCase.execute({
      sessionId: id,
      userId: user.id,
      isAdmin,
    });

    if (initialized.isFailure) {
      return c.json({ message: errorToMessage(initialized.error) }, errorToStatus(initialized.error) as any);
    }

    return sseResponse(initialized.value);
  });

  app.get('/:id', async (c) => {
    const user = await requireUser(c);
    const isAdmin = await getIsAdmin(user.id);
    const id = c.req.param('id');

    const result = await container.getDmSessionUseCase.execute({
      sessionId: id,
      userId: user.id,
      isAdmin,
    });

    if (result.isFailure) {
      return c.json({ message: errorToMessage(result.error) }, errorToStatus(result.error) as any as any);
    }

    return c.json({
      ...DmSessionMapper.toResponse(result.value.session),
      turns: result.value.turns.map(DmTurnMapper.toResponse),
    });
  });

  app.post('/:id/turns', async (c) => {
    const user = await requireUser(c);
    const isAdmin = await getIsAdmin(user.id);
    const id = c.req.param('id');
    const { playerInput } = await c.req.json();

    const result = await container.sendPlayerTurnUseCase.execute({
      sessionId: id,
      playerInput,
      userId: user.id,
      isAdmin,
    });

    if (result.isFailure) {
      return c.json({ message: errorToMessage(result.error) }, errorToStatus(result.error) as any as any);
    }

    return sseResponse(result.value);
  });

  app.get('/:id/metrics', async (c) => {
    const user = await requireUser(c);
    const isAdmin = await getIsAdmin(user.id);
    const id = c.req.param('id');

    const result = await container.getSessionMetricsUseCase.execute({
      sessionId: id,
      userId: user.id,
      isAdmin,
    });

    if (result.isFailure) {
      return c.json({ message: errorToMessage(result.error) }, errorToStatus(result.error) as any as any);
    }

    return c.json({
      ...result.value,
      turnBreakdown: result.value.turnBreakdown.map(DmTurnMapper.toResponse),
    });
  });

  app.post('/:id/auto-turn', async (c) => {
    const user = await requireUser(c);
    const isAdmin = await getIsAdmin(user.id);
    const id = c.req.param('id');

    const sessionResult = await container.getDmSessionUseCase.execute({
      sessionId: id,
      userId: user.id,
      isAdmin,
    });

    if (sessionResult.isFailure) {
      return c.json({ message: errorToMessage(sessionResult.error) }, errorToStatus(sessionResult.error) as any);
    }

    const { session, turns } = sessionResult.value;
    const character = session.characters[0];

    let playerInput: string;

    const lastDmResponse = turns.length > 0 ? turns[turns.length - 1].dmResponse : '';
    const skillCheck = parseSkillCheck(lastDmResponse);

    if (!skillCheck && /tirada/i.test(lastDmResponse)) {
      // El DM parece estar pidiendo una tirada pero el parser no la reconoció.
      // Loguear el texto crudo (con sus bytes reales) para diagnosticar variantes
      // que un reporte de bug transcrito a mano no puede capturar (unicode, espacios invisibles, etc).
      logger.warn('auto-turn: posible tirada no detectada por parseSkillCheck', {
        sessionId: id,
        rawText: lastDmResponse,
      });
    }

    const existingMemory: SessionMemory = {
      npcs: (session.memorySnapshot as Record<string, unknown>)?.npcs as string[] ?? [],
      locations: (session.memorySnapshot as Record<string, unknown>)?.locations as string[] ?? [],
      events: (session.memorySnapshot as Record<string, unknown>)?.events as string[] ?? [],
    };

    if (autoPlayer && lastDmResponse) {
      try {
        const updatedMemory = await autoPlayer.extractFacts(lastDmResponse, existingMemory);
        const hasNewFacts =
          updatedMemory.npcs.length !== existingMemory.npcs.length ||
          updatedMemory.locations.length !== existingMemory.locations.length ||
          updatedMemory.events.length !== existingMemory.events.length;

        if (hasNewFacts) {
          const updated = session.withMemory(updatedMemory as unknown as Record<string, unknown>);
          await container.dmSessionRepo.save(updated);
          existingMemory.npcs = updatedMemory.npcs;
          existingMemory.locations = updatedMemory.locations;
          existingMemory.events = updatedMemory.events;
        }
      } catch {
        // extraction failed, continue with existing memory
      }
    }

    if (skillCheck && character?.stats) {
      playerInput = autoRollSkillCheck(skillCheck, character);
    } else if (autoPlayer && character) {
      const conversationHistory: { role: 'player' | 'dm'; content: string }[] = [];
      for (const turn of turns) {
        if (turn.playerInput) conversationHistory.push({ role: 'player', content: turn.playerInput });
        conversationHistory.push({ role: 'dm', content: turn.dmResponse });
      }

      try {
        playerInput = await autoPlayer.generatePlayerAction({
          character,
          campaignPrompt: session.campaignPrompt,
          conversationHistory,
          lastDmResponse,
          sessionMemory: existingMemory,
        });
      } catch (err) {
        console.error('[auto-turn] generatePlayerAction failed:', String(err));
        playerInput = randomFallbackAction(character.name);
      }
    } else {
      playerInput = randomFallbackAction(character.name);
    }

    const result = await container.sendPlayerTurnUseCase.execute({
      sessionId: id,
      playerInput,
      userId: user.id,
      isAdmin,
    });

    if (result.isFailure) {
      return c.json({ message: errorToMessage(result.error) }, errorToStatus(result.error) as any);
    }

    return sseResponse(result.value, [{ type: 'player_input', input: playerInput }]);
  });

  app.post('/:id/end', async (c) => {
    const user = await requireUser(c);
    const isAdmin = await getIsAdmin(user.id);
    const id = c.req.param('id');

    const result = await container.endDmSessionUseCase.execute({
      sessionId: id,
      userId: user.id,
      isAdmin,
    });

    if (result.isFailure) {
      return c.json({ message: errorToMessage(result.error) }, errorToStatus(result.error) as any);
    }

    return c.json(DmSessionMapper.toSummaryResponse(result.value));
  });

  app.delete('/:id', async (c) => {
    const user = await requireUser(c);
    const isAdmin = await getIsAdmin(user.id);
    const id = c.req.param('id');

    const result = await container.softDeleteDmSessionUseCase.execute({
      sessionId: id,
      userId: user.id,
      isAdmin,
    });

    if (result.isFailure) {
      return c.json({ message: errorToMessage(result.error) }, errorToStatus(result.error) as any);
    }

    return c.json({ success: true });
  });

  return app;
}
