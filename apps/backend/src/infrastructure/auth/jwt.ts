import { SignJWT, jwtVerify } from 'jose';
import type { AuthUser } from './types';

const ALG = 'HS256';
const EXPIRY = '7d';

function getKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function signToken(user: AuthUser, secret: string): Promise<string> {
  return new SignJWT({ sub: user.id, email: user.email })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(getKey(secret));
}

export async function verifyToken(token: string, secret: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, getKey(secret), { algorithms: [ALG] });
    if (!payload.sub || typeof payload.email !== 'string') return null;
    return { id: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}
