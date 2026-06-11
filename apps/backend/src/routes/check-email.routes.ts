import { Hono } from 'hono';
import type { CloudflareBindings } from '../types/bindings';
import { getSupabaseAdmin } from '../infrastructure/auth/supabase';

export function checkEmailRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();

  app.get('/check-email/:email', async (c) => {
    const email = c.req.param('email');
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
