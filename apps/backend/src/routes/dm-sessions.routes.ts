import { Hono } from 'hono';
import type { CloudflareBindings } from '../types/bindings';
import type { Container } from '../infrastructure/container';
import { requireUser } from '../infrastructure/auth/guards';
import { DmSessionMapper } from '../dm-session/infrastructure/mappers/dm-session.mapper';
import { DmTurnMapper } from '../dm-session/infrastructure/mappers/dm-turn.mapper';
import { DmSessionError } from '../dm-session/application/errors';
import type { DmModelChunk } from '../dm-session/domain/ports/dm-model.provider';

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
      return 409;
    default:
      return 500;
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

export function dmSessionsRoutes(container: Container) {
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
      return c.json({ message: result.error }, errorToStatus(result.error) as any as any);
    }

    return c.json(result.value.map(DmSessionMapper.toSummaryResponse));
  });

  app.post('/', async (c) => {
    const user = await requireUser(c);
    const isAdmin = await getIsAdmin(user.id);
    const body = await c.req.json();

    const created = await container.createDmSessionUseCase.execute({
      userId: user.id,
      title: body.title,
      campaignPrompt: body.campaignPrompt,
      characters: body.characters,
      architectureType: body.architectureType,
      modelId: body.modelId,
    });

    if (created.isFailure) {
      return c.json({ message: created.error }, errorToStatus(created.error) as any);
    }

    const session = created.value;

    const initialized = await container.initializeDmSessionUseCase.execute({
      sessionId: session.id.toString(),
      userId: user.id,
      isAdmin,
    });

    if (initialized.isFailure) {
      return c.json({ message: initialized.error }, errorToStatus(initialized.error) as any);
    }

    return sseResponse(initialized.value, [
      { type: 'session', session: DmSessionMapper.toResponse(session) },
    ]);
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
      return c.json({ message: result.error }, errorToStatus(result.error) as any as any);
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
      return c.json({ message: result.error }, errorToStatus(result.error) as any as any);
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
      return c.json({ message: result.error }, errorToStatus(result.error) as any as any);
    }

    return c.json({
      ...result.value,
      turnBreakdown: result.value.turnBreakdown.map(DmTurnMapper.toResponse),
    });
  });

  app.delete('/:id', async (c) => {
    const user = await requireUser(c);
    const isAdmin = await getIsAdmin(user.id);
    const id = c.req.param('id');

    const result = await container.endDmSessionUseCase.execute({
      sessionId: id,
      userId: user.id,
      isAdmin,
    });

    if (result.isFailure) {
      return c.json({ message: result.error }, errorToStatus(result.error) as any as any);
    }

    return c.json(DmSessionMapper.toSummaryResponse(result.value));
  });

  return app;
}
