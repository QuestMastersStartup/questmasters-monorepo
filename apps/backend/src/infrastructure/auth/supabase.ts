import { createClient, type User } from '@supabase/supabase-js';
import type { Context } from 'hono';
import type { CloudflareBindings } from '../../types/bindings';
import type { Container } from '../container';
import { UserProfile } from '../../users/domain/entities/user-profile.entity';

function makeClient(env: CloudflareBindings) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
}

function makeAdminClient(env: CloudflareBindings) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseAdmin(env: CloudflareBindings) {
  return makeAdminClient(env);
}

async function getUserFromHeader(
  authHeader: string | undefined,
  env: CloudflareBindings,
): Promise<User | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error } = await makeClient(env).auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

export async function requireUser(
  c: Context<{ Bindings: CloudflareBindings }>,
): Promise<User> {
  const user = await getUserFromHeader(c.req.header('authorization'), c.env);
  if (!user) throw new Error('Unauthorized');
  return user;
}

export async function requireRole(
  c: Context<{ Bindings: CloudflareBindings }>,
  allowedRoles: ('admin' | 'creator' | 'player')[],
  container: Container,
): Promise<{ user: User; profile: UserProfile }> {
  const user = await requireUser(c);
  const profile = await container.getUserProfileUseCase.execute(user.id);

  if (!allowedRoles.includes(profile.role) && !profile.isAdmin) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }

  return { user, profile };
}

export async function requireOwnerOrAdmin(
  c: Context<{ Bindings: CloudflareBindings }>,
  ownerId: string,
  container: Container,
): Promise<{ user: User; profile: UserProfile }> {
  const user = await requireUser(c);
  const profile = await container.getUserProfileUseCase.execute(user.id);

  if (user.id !== ownerId && !profile.isAdmin) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }

  return { user, profile };
}
