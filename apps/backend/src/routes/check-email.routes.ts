import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import type { CloudflareBindings } from '../types/bindings';
import { userCredentials } from '../infrastructure/db/schema';
import { getSupabaseAdmin } from '../infrastructure/auth/supabase';

export function checkEmailRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();

  app.get('/check-email/:email', async (c) => {
    const email = c.req.param('email');

    if (c.env.TESIS === 'true') {
      const db = drizzle(c.env.DB);
      const existing = await db.select({ userId: userCredentials.userId })
        .from(userCredentials)
        .where(eq(userCredentials.email, email))
        .get();
      return c.json({ available: !existing });
    }

    // Supabase path
    const admin = getSupabaseAdmin(c.env);
    const { data, error } = await admin.auth.admin.listUsers();
    if (error) {
      console.error('Error checking email:', error);
      return c.json({ available: true });
    }
    const isAvailable = !data.users.some((u) => u.email === email);
    return c.json({ available: isAvailable });
  });

  return app;
}
