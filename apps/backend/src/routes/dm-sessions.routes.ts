import { Elysia } from 'elysia';
import type { Container } from '../infrastructure/container';
import { requireUser } from '../infrastructure/auth/supabase';
import {
  CreateDmSessionSchema,
  SendPlayerTurnSchema,
  DmSessionParamsSchema,
} from '../schemas/dm-session.schema';
import { DmSessionMapper } from '../dm-session/infrastructure/mappers/dm-session.mapper';
import { DmTurnMapper } from '../dm-session/infrastructure/mappers/dm-turn.mapper';
import { DmSessionError } from '../dm-session/application/errors';
import type { DmModelChunk } from '../dm-session/domain/ports/dm-model.provider';

/**
 * Maps a DmSessionError to the appropriate HTTP status code.
 */
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

/**
 * Builds an SSE Response from an AsyncGenerator of DmModelChunks.
 * `prelude` events (e.g. the created session) are emitted before the stream.
 */
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
        'Connection': 'keep-alive',
      },
    },
  );
}

export function dmSessionsRoutes(container: Container) {
  /** Resolve isAdmin once per request from the user's profile. */
  async function getIsAdmin(userId: string): Promise<boolean> {
    const profile = await container.getUserProfileUseCase.execute(userId);
    return profile.isAdmin;
  }

  return new Elysia({ prefix: '/dm-sessions' })

    // ─── GET /dm-sessions — List sessions ─────────────────────────────
    .get(
      '/',
      async ({ request, set }) => {
        const user = await requireUser(request, set);
        const isAdmin = await getIsAdmin(user.id);

        const result = await container.listDmSessionsUseCase.execute({
          userId: user.id,
          isAdmin,
        });

        if (result.isFailure) {
          set.status = errorToStatus(result.error);
          return { message: result.error };
        }

        return result.value.map(DmSessionMapper.toSummaryResponse);
      },
      {
        detail: {
          summary: 'List DM sessions (admin sees all, users see their own)',
          tags: ['DM Sessions'],
        },
      },
    )

    // ─── POST /dm-sessions — Create + auto-initialize (SSE) ──────────
    .post(
      '/',
      async ({ body, request, set }) => {
        const user = await requireUser(request, set);
        const isAdmin = await getIsAdmin(user.id);

        const created = await container.createDmSessionUseCase.execute({
          userId: user.id,
          title: body.title,
          campaignPrompt: body.campaignPrompt,
          characters: body.characters,
          architectureType: body.architectureType,
          modelId: body.modelId,
        });

        if (created.isFailure) {
          set.status = errorToStatus(created.error);
          return { message: created.error };
        }

        const session = created.value;

        // Auto-trigger del primer turno del DM, streameado por SSE
        const initialized = await container.initializeDmSessionUseCase.execute({
          sessionId: session.id.toString(),
          userId: user.id,
          isAdmin,
        });

        if (initialized.isFailure) {
          set.status = errorToStatus(initialized.error);
          return { message: initialized.error };
        }

        // Primer evento: la sesión creada (el frontend necesita el id antes
        // de los chunks del turno inicial)
        return sseResponse(initialized.value, [
          { type: 'session', session: DmSessionMapper.toResponse(session) },
        ]);
      },
      {
        body: CreateDmSessionSchema,
        detail: {
          summary: 'Create a DM session and stream the opening DM turn (SSE)',
          tags: ['DM Sessions'],
        },
      },
    )

    // ─── GET /dm-sessions/:id — Session with its turns ────────────────
    .get(
      '/:id',
      async ({ params, request, set }) => {
        const user = await requireUser(request, set);
        const isAdmin = await getIsAdmin(user.id);

        const result = await container.getDmSessionUseCase.execute({
          sessionId: params.id,
          userId: user.id,
          isAdmin,
        });

        if (result.isFailure) {
          set.status = errorToStatus(result.error);
          return { message: result.error };
        }

        return {
          ...DmSessionMapper.toResponse(result.value.session),
          turns: result.value.turns.map(DmTurnMapper.toResponse),
        };
      },
      {
        params: DmSessionParamsSchema,
        detail: {
          summary: 'Get a DM session with all its turns',
          tags: ['DM Sessions'],
        },
      },
    )

    // ─── POST /dm-sessions/:id/turns — Player turn (SSE) ─────────────
    .post(
      '/:id/turns',
      async ({ params, body, request, set }) => {
        const user = await requireUser(request, set);
        const isAdmin = await getIsAdmin(user.id);

        const result = await container.sendPlayerTurnUseCase.execute({
          sessionId: params.id,
          playerInput: body.playerInput,
          userId: user.id,
          isAdmin,
        });

        if (result.isFailure) {
          set.status = errorToStatus(result.error);
          return { message: result.error };
        }

        return sseResponse(result.value);
      },
      {
        params: DmSessionParamsSchema,
        body: SendPlayerTurnSchema,
        detail: {
          summary: 'Send a player turn and stream the DM response (SSE)',
          tags: ['DM Sessions'],
        },
      },
    )

    // ─── GET /dm-sessions/:id/metrics — Metrics (admin only) ─────────
    .get(
      '/:id/metrics',
      async ({ params, request, set }) => {
        const user = await requireUser(request, set);
        const isAdmin = await getIsAdmin(user.id);

        const result = await container.getSessionMetricsUseCase.execute({
          sessionId: params.id,
          userId: user.id,
          isAdmin,
        });

        if (result.isFailure) {
          set.status = errorToStatus(result.error);
          return { message: result.error };
        }

        return {
          ...result.value,
          turnBreakdown: result.value.turnBreakdown.map(DmTurnMapper.toResponse),
        };
      },
      {
        params: DmSessionParamsSchema,
        detail: {
          summary: 'Get aggregated session metrics (admin only)',
          tags: ['DM Sessions'],
        },
      },
    )

    // ─── DELETE /dm-sessions/:id — End session ────────────────────────
    .delete(
      '/:id',
      async ({ params, request, set }) => {
        const user = await requireUser(request, set);
        const isAdmin = await getIsAdmin(user.id);

        const result = await container.endDmSessionUseCase.execute({
          sessionId: params.id,
          userId: user.id,
          isAdmin,
        });

        if (result.isFailure) {
          set.status = errorToStatus(result.error);
          return { message: result.error };
        }

        return DmSessionMapper.toSummaryResponse(result.value);
      },
      {
        params: DmSessionParamsSchema,
        detail: {
          summary: 'End a DM session',
          tags: ['DM Sessions'],
        },
      },
    );
}
