import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { CloudflareBindings } from './types/bindings';
import { createDb } from './infrastructure/db/connection';
import { createContainer } from './infrastructure/container';
import { rulesRoutes } from './routes/rules.routes';
import { usersRoutes } from './routes/users.routes';
import { usernameRoutes } from './routes/username.routes';
import { avatarRoutes } from './routes/avatar.routes';
import { checkEmailRoutes } from './routes/check-email.routes';
import { packsRoutes } from './routes/packs.routes';
import { assetsRoutes } from './routes/assets.routes';
import { charactersRoutes } from './routes/characters.routes';
import { campaignsRoutes } from './routes/campaigns.routes';
import { dmSessionsRoutes } from './routes/dm-sessions.routes';
import { authRoutes } from './routes/auth.routes';

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use('*', async (c, next) => {
  const allowed = c.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:3001', 'http://localhost:3000'];
  return cors({
    origin: allowed,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })(c, next);
});

app.get('/', (c) => c.json({ name: 'QuestMasters API', status: 'ok' }));
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.onError((err, c) => {
  if (err.message === 'Unauthorized') return c.json({ message: 'Unauthorized' }, 401);
  if ((err as any).status === 403) return c.json({ message: 'Forbidden' }, 403);
  console.error('Unhandled error', err);
  return c.json({ message: 'Internal server error' }, 500);
});

// Container is created per-request (Workers are stateless — no shared DB connection)
app.all('/api/*', async (c) => {
  const db = createDb(c.env.DB);
  const container = createContainer(db, c.env);

  // Seed SRD data if not yet in D1 — no-op after first run (2 fast existsBySlug queries)
  await container.srdSeederService.onApplicationBootstrap();

  const api = new Hono<{ Bindings: CloudflareBindings }>();
  api.get('/', (ctx) => ctx.text('QuestMasters API is running!'));
  api.route('/users', usersRoutes(container));
  api.route('/users', usernameRoutes(container));
  api.route('/auth', checkEmailRoutes());
  api.route('/auth', authRoutes());
  api.route('/users', avatarRoutes(container));
  api.route('/campaigns', campaignsRoutes(container));
  api.route('/characters', charactersRoutes(container));
  api.route('/dm-sessions', dmSessionsRoutes(container));
  api.route('/packs', packsRoutes(container));
  api.route('/packs/:slug/assets', assetsRoutes(container));
  api.route('/rules', rulesRoutes(container));

  const url = new URL(c.req.url);
  url.pathname = url.pathname.replace(/^\/api/, '') || '/';
  return api.fetch(new Request(url.toString(), c.req.raw), c.env);
});

export default app;
