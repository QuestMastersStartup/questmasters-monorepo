import { Hono } from 'hono';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import type { CloudflareBindings } from '../types/bindings';
import { userProfiles, userCredentials } from '../infrastructure/db/schema';
import { signToken } from '../infrastructure/auth/jwt';

const registerSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string(),
});

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial, 256,
  );
  const toHex = (arr: Uint8Array) => Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${toHex(salt)}:${toHex(new Uint8Array(bits))}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':');
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial, 256,
  );
  const computed = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
  return computed === hashHex;
}

export function authRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();

  app.post('/register', async (c) => {
    if (c.env.TESIS !== 'true') return c.json({ message: 'Not available in this mode' }, 501);

    const body = await c.req.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return c.json({ message: 'Invalid input', errors: parsed.error.flatten() }, 400);

    const { email, password, username } = parsed.data;
    const db = drizzle(c.env.DB);

    const existing = await db.select({ userId: userCredentials.userId })
      .from(userCredentials)
      .where(eq(userCredentials.email, email))
      .get();
    if (existing) return c.json({ message: 'Email already registered' }, 409);

    const userId = crypto.randomUUID();
    const passwordHash = await hashPassword(password);

    await db.batch([
      db.insert(userProfiles).values({ id: userId, username, role: 'player' }),
      db.insert(userCredentials).values({ userId, email, passwordHash }),
    ]);

    const token = await signToken({ id: userId, email }, c.env.JWT_SECRET);
    return c.json({ token, userId }, 201);
  });

  app.post('/login', async (c) => {
    if (c.env.TESIS !== 'true') return c.json({ message: 'Not available in this mode' }, 501);

    const body = await c.req.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return c.json({ message: 'Invalid input' }, 400);

    const { email, password } = parsed.data;
    const db = drizzle(c.env.DB);

    const cred = await db.select()
      .from(userCredentials)
      .where(eq(userCredentials.email, email))
      .get();
    if (!cred) return c.json({ message: 'Invalid credentials' }, 401);

    const valid = await verifyPassword(password, cred.passwordHash);
    if (!valid) return c.json({ message: 'Invalid credentials' }, 401);

    const profile = await db.select({ username: userProfiles.username })
      .from(userProfiles)
      .where(eq(userProfiles.id, cred.userId))
      .get();

    const token = await signToken({ id: cred.userId, email }, c.env.JWT_SECRET);
    return c.json({ token, userId: cred.userId, username: profile?.username ?? '' });
  });

  return app;
}
