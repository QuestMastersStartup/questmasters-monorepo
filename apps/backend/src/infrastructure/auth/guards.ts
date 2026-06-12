import type { Context } from 'hono';
import type { CloudflareBindings } from '../../types/bindings';
import type { Container } from '../container';
import type { UserProfile } from '../../users/domain/entities/user-profile.entity';
import type { AuthUser } from './types';
import { verifyToken } from './jwt';
import {
  requireUser as supabaseRequireUser,
  requireRole as supabaseRequireRole,
  requireOwnerOrAdmin as supabaseRequireOwnerOrAdmin,
} from './supabase';

function isTesis(env: CloudflareBindings): boolean {
  return env.TESIS === 'true';
}

async function extractJwtUser(
  c: Context<{ Bindings: CloudflareBindings }>,
): Promise<AuthUser | null> {
  const header = c.req.header('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.split(' ')[1];
  return verifyToken(token, c.env.JWT_SECRET);
}

export async function requireUser(
  c: Context<{ Bindings: CloudflareBindings }>,
): Promise<AuthUser> {
  if (isTesis(c.env)) {
    const user = await extractJwtUser(c);
    if (!user) throw new Error('Unauthorized');
    return user;
  }
  const sbUser = await supabaseRequireUser(c);
  return { id: sbUser.id, email: sbUser.email ?? '', username: sbUser.user_metadata?.username };
}

export async function requireRole(
  c: Context<{ Bindings: CloudflareBindings }>,
  allowedRoles: ('admin' | 'creator' | 'player')[],
  container: Container,
): Promise<{ user: AuthUser; profile: UserProfile }> {
  if (isTesis(c.env)) {
    const user = await requireUser(c);
    const profile = await container.getUserProfileUseCase.execute(user.id);
    if (!allowedRoles.includes(profile.role) && !profile.isAdmin) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }
    return { user, profile };
  }
  const { user: sbUser, profile } = await supabaseRequireRole(c, allowedRoles, container);
  return { user: { id: sbUser.id, email: sbUser.email ?? '' }, profile };
}

export async function requireOwnerOrAdmin(
  c: Context<{ Bindings: CloudflareBindings }>,
  ownerId: string,
  container: Container,
): Promise<{ user: AuthUser; profile: UserProfile }> {
  if (isTesis(c.env)) {
    const user = await requireUser(c);
    const profile = await container.getUserProfileUseCase.execute(user.id);
    if (user.id !== ownerId && !profile.isAdmin) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }
    return { user, profile };
  }
  const { user: sbUser, profile } = await supabaseRequireOwnerOrAdmin(c, ownerId, container);
  return { user: { id: sbUser.id, email: sbUser.email ?? '' }, profile };
}
