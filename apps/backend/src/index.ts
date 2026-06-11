import 'reflect-metadata';
import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { rateLimit } from 'elysia-rate-limit';
import { swagger } from '@elysiajs/swagger';
import { env } from './infrastructure/env';
import { logger } from './shared/infrastructure/logger';
import { createDataSource } from './infrastructure/database';
import { createContainer } from './infrastructure/container';
import { packsRoutes } from './routes/packs.routes';
import { assetsRoutes } from './routes/assets.routes';
import { rulesRoutes } from './routes/rules.routes';
import { usersRoutes } from './routes/users.routes';
import { usernameRoutes } from './routes/username.routes';
import { avatarRoutes } from './routes/avatar.routes';
import { campaignsRoutes } from './routes/campaigns.routes';
import { charactersRoutes } from './routes/characters.routes';
import { dmSessionsRoutes } from './routes/dm-sessions.routes';
import { checkEmailRoutes } from './routes/check-email.routes';
import { seedAdminUser } from './infrastructure/seed-admin';

// US-0.7: Env validation happens at import — fails fast if vars are missing
logger.info('Environment validated', { NODE_ENV: env.NODE_ENV, PORT: env.PORT });

// Initialize database
const dataSource = await createDataSource();

// Wire up DI container
const container = createContainer(dataSource);

// Run seeders on startup
await container.srdSeederService.onApplicationBootstrap();
await seedAdminUser(dataSource);

const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') ?? [
  'http://localhost:3001',
  'http://localhost:3000',
];

// Create Elysia app
const app = new Elysia()
  // US-0.6: Health check endpoint
  .get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }))
  // US-0.6: Request logging middleware
  .onRequest(({ request }) => {
    (request as any)._startTime = Date.now();
  })
  .onAfterResponse(({ request, set }) => {
    const duration = Date.now() - ((request as any)._startTime ?? Date.now());
    logger.info('request', {
      method: request.method,
      path: new URL(request.url).pathname,
      status: set.status ?? 200,
      duration_ms: duration,
    });
  })
  .use(
    cors({
      origin: (request) => {
        const origin = request.headers.get('origin');
        if (!origin || allowedOrigins.includes(origin)) return true;
        return false;
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  )
  .use(
    rateLimit({
      duration: 60000,
      max: 100,
      errorResponse: 'Too many requests, please try again later.',
    }),
  )
  .use(
    swagger({
      path: '/api/docs',
      documentation: {
        info: {
          title: 'QuestMasters API',
          description: 'Core API for QuestMasters VTT platform',
          version: '1.0.0',
        },
        tags: [
          { name: 'Packs', description: 'Content Pack management' },
          { name: 'Assets', description: 'Asset management within packs' },
          { name: 'Rules', description: 'D&D rules engine operations' },
          { name: 'Campaigns', description: 'Campaign and session management' },
          { name: 'Characters', description: 'Character management and builder' },
          { name: 'DM Sessions', description: 'AI DM research sessions (MAS vs monolithic orchestration)' },
        ],
      },
    }),
  )
  .group('/api', (app) =>
    app
      .get('/', () => 'QuestMasters API is running!')
      .use(usersRoutes(container))
      .use(usernameRoutes(container))
      .use(checkEmailRoutes())
      .use(avatarRoutes(container))
      .use(campaignsRoutes(container))
      .use(charactersRoutes(container))
      .use(dmSessionsRoutes(container))
      .use(packsRoutes(container))
      .use(assetsRoutes(container))
      .use(rulesRoutes(container)),
  )
  .onError(({ error, set }) => {
    // Don't log auth errors as server errors
    if ((error as any).message === 'Unauthorized') {
      set.status = 401;
      return { message: 'Unauthorized' };
    }
    logger.error('Unhandled server error', { error: String(error) });
    set.status = 500;
    return { message: 'Internal server error' };
  })
  .listen(env.PORT);

logger.info(`QuestMasters API running`, {
  url: `http://${app.server?.hostname}:${app.server?.port}`,
});
