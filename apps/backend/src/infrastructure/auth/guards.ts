import type { Context } from 'hono';
import type { CloudflareBindings } from '../../types/bindings';
import type { Container } from '../container';
import type { UserProfile } from '../../users/domain/entities/user-profile.entity';
import type { AuthUser } from './types';
import { verifyToken } from './jwt';

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
  const user = await extractJwtUser(c);
  if (!user) throw new Error('Unauthorized');
  return user;
}

export async function requireRole(
  c: Context<{ Bindings: CloudflareBindings }>,
  allowedRoles: ('admin' | 'creator' | 'player')[],
  container: Container,
): Promise<{ user: AuthUser; profile: UserProfile }> {
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
): Promise<{ user: AuthUser; profile: UserProfile }> {
  const user = await requireUser(c);
  const profile = await container.getUserProfileUseCase.execute(user.id);
  if (user.id !== ownerId && !profile.isAdmin) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }
  return { user, profile };
}
