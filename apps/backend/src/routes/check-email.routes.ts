import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import type { CloudflareBindings } from '../types/bindings';
import { userCredentials } from '../infrastructure/db/schema';

export function checkEmailRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();

  app.get('/check-email/:email', async (c) => {
    const email = c.req.param('email');
    const db = drizzle(c.env.DB);
    const existing = await db.select({ userId: userCredentials.userId })
      .from(userCredentials)
      .where(eq(userCredentials.email, email))
      .get();
    return c.json({ available: !existing });
  });

  return app;
}
