import { Elysia } from 'elysia';
import { createClient, type User } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase URL or Key is missing. Auth will not work properly.');
}

export const supabaseClient = createClient(supabaseUrl, supabaseKey);

/**
 * Extracts and verifies user from the Authorization header.
 * Returns the Supabase User or null.
 */
export async function getUserFromRequest(request: Request): Promise<User | null> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

/**
 * Elysia macro-style plugin that adds a `requireUser` method 
 * to extract the authenticated user from the request.
 * 
 * Use inside route handlers: `const user = await requireUser(context.request, context.set);`
 */
export async function requireUser(request: Request, set: any): Promise<User> {
  const user = await getUserFromRequest(request);
  if (!user) {
    set.status = 401;
    throw new Error('Unauthorized');
  }
  return user;
}

/**
 * Legacy Elysia plugin export — kept for backward compatibility with 
 * packs.routes.ts and assets.routes.ts which use `.use(requireAuth)`.
 * Uses `.derive()` with `as('global')` to propagate the user.
 */
export const requireAuth = new Elysia({ name: 'require-auth' })
  .derive({ as: 'global' }, async ({ request, set }) => {
    const user = await getUserFromRequest(request);

    if (!user) {
      set.status = 401;
      throw new Error('Unauthorized');
    }

    return { user };
  });
