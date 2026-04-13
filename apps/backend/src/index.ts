import 'reflect-metadata';
import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { rateLimit } from 'elysia-rate-limit';
import { swagger } from '@elysiajs/swagger';
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
import { checkEmailRoutes } from './routes/check-email.routes';
import { seedAdminUser } from './infrastructure/seed-admin';

// Initialize database
const dataSource = await createDataSource();

// Wire up DI container
const container = createContainer(dataSource);

// Run seeders on startup
await container.srdSeederService.onApplicationBootstrap();
await seedAdminUser(dataSource);

const allowedOrigins = Bun.env.ALLOWED_ORIGINS?.split(',') ?? [
  'http://localhost:3001',
  'http://localhost:3000',
];

// Create Elysia app
const app = new Elysia()
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
    console.error(error);
    set.status = 500;
    return { message: 'Internal server error' };
  })
  .listen(Bun.env.PORT ?? 3000);

console.log(
  `🦊 QuestMasters API running at http://${app.server?.hostname}:${app.server?.port}`,
);
