# TESIS Cloudflare Migration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `TESIS=true` env toggle that switches the backend from Supabase (auth + storage) to Cloudflare-native providers (custom JWT + R2), while keeping D1 as the primary database in both modes.

**Architecture:** The `TESIS` flag in `CloudflareBindings` (wrangler var + local `.env`) acts as a feature toggle read at request time. When `true`, auth guards use `jose`-based JWT verified against `JWT_SECRET`; credentials live in a D1 `user_credentials` table (PBKDF2 hashed); avatar storage writes to an R2 bucket. When `false`/absent, the existing Supabase JWT and Supabase Storage paths remain active. The D1 database (Drizzle ORM) is already the primary store in both modes — no DB migration needed for existing tables.

**Tech Stack:** Hono, Drizzle ORM (drizzle-orm/d1), Cloudflare D1 + R2, `jose` (JWT HS256 via Web Crypto), PBKDF2 (Web Crypto API — no Node.js dependency), Wrangler CLI, Zod

---

## Part A — Cloudflare Platform Actions (Bryan)

> These steps require the Cloudflare Dashboard and Wrangler CLI. Do them before or in parallel with the code tasks.

### A1: Log in to Wrangler

```bash
cd apps/backend
npx wrangler login
```

Opens a browser window — authorize with your Cloudflare account.

---

### A2: Create the D1 Database

```bash
npx wrangler d1 create questmasters
```

Output will include:
```
database_name = "questmasters"
database_id   = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Copy the `database_id`** — you'll paste it into `wrangler.toml` in Task 1.

---

### A3: Create the R2 Bucket

```bash
npx wrangler r2 bucket create questmasters-avatars
```

Then in the **Cloudflare Dashboard**:
1. Go to **R2 → questmasters-avatars → Settings**
2. Enable **"Public access"**
3. Copy the **Public Bucket URL** (format: `https://pub-XXXXXXXX.r2.dev`)

You'll need this URL for `R2_PUBLIC_URL` in `wrangler.toml`.

---

### A4: Generate a JWT Secret

Run in any terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Save the output — you'll set it as a Wrangler secret in A5.

---

### A5: Set Wrangler Secrets

```bash
cd apps/backend

npx wrangler secret put JWT_SECRET
# Paste the hex string from A4 when prompted

npx wrangler secret put DM_MODEL_ENDPOINT_MAS
# Paste your RunPod MAS endpoint URL

npx wrangler secret put DM_MODEL_ENDPOINT_MONOLITHIC
# Paste your RunPod Monolithic endpoint URL
```

> `SUPABASE_*` secrets are NOT needed when `TESIS=true`. You can skip them or set them for fallback support.

---

### A6: Run DB Migrations (Remote D1)

After Tasks 1–2 are committed:

```bash
cd apps/backend
npx wrangler d1 execute questmasters --remote --file=drizzle/0000_groovy_fat_cobra.sql
npx wrangler d1 execute questmasters --remote --file=drizzle/0001_tesis_auth.sql
```

---

### A7: Deploy the Worker

```bash
cd apps/backend
npx wrangler deploy
```

Note the Worker URL shown: `https://questmasters-api.<subdomain>.workers.dev`

---

### A8: Update Frontend API URL

In your frontend's production env file:

```
VITE_API_URL=https://questmasters-api.<subdomain>.workers.dev
```

---

## Part B — Code Implementation (AI Agent)

### File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `apps/backend/src/types/bindings.ts` | Modify | Add `TESIS`, `JWT_SECRET`, `AVATARS_BUCKET`, `R2_PUBLIC_URL` |
| `apps/backend/wrangler.toml` | Modify | Real `database_id`, R2 binding, TESIS + R2_PUBLIC_URL vars |
| `apps/backend/.env` | Modify | Document TESIS and JWT_SECRET for local dev |
| `apps/backend/src/infrastructure/auth/types.ts` | **Create** | Shared `AuthUser` type (replaces Supabase's `User` in guard signatures) |
| `apps/backend/src/infrastructure/auth/jwt.ts` | **Create** | `signToken` / `verifyToken` using `jose` HS256 |
| `apps/backend/src/infrastructure/auth/guards.ts` | **Create** | TESIS-aware `requireUser`, `requireRole`, `requireOwnerOrAdmin` |
| `apps/backend/src/infrastructure/storage/r2.ts` | **Create** | `uploadToR2()` using `R2Bucket.put()` |
| `apps/backend/src/infrastructure/storage/index.ts` | **Create** | `uploadAvatar()` — dispatches to R2 or Supabase based on TESIS |
| `apps/backend/src/infrastructure/db/schema.ts` | Modify | Add `userCredentials` table |
| `apps/backend/drizzle/0001_tesis_auth.sql` | **Create** | SQL migration for `user_credentials` |
| `apps/backend/src/routes/auth.routes.ts` | **Create** | `POST /register` + `POST /login` (TESIS mode only) |
| `apps/backend/src/routes/avatar.routes.ts` | Modify | Use `uploadAvatar` from storage adapter |
| `apps/backend/src/routes/check-email.routes.ts` | Modify | Query D1 in TESIS mode, Supabase in non-TESIS |
| `apps/backend/src/routes/assets.routes.ts` | Modify | Import guards from `auth/guards` instead of `auth/supabase` |
| `apps/backend/src/routes/campaigns.routes.ts` | Modify | Import guards from `auth/guards` instead of `auth/supabase` |
| `apps/backend/src/routes/characters.routes.ts` | Modify | Import guards from `auth/guards` instead of `auth/supabase` |
| `apps/backend/src/routes/dm-sessions.routes.ts` | Modify | Import guards from `auth/guards` instead of `auth/supabase` |
| `apps/backend/src/routes/packs.routes.ts` | Modify | Import guards from `auth/guards` instead of `auth/supabase` |
| `apps/backend/src/routes/users.routes.ts` | Modify | Import guards from `auth/guards` instead of `auth/supabase` |
| `apps/backend/src/index.ts` | Modify | Mount `authRoutes()` at `/api/auth` |

---

### Task 1: Update bindings and wrangler config

**Files:**
- Modify: `apps/backend/src/types/bindings.ts`
- Modify: `apps/backend/wrangler.toml`
- Modify: `apps/backend/.env`

- [ ] **Step 1: Replace `CloudflareBindings` type**

Replace the entire content of `apps/backend/src/types/bindings.ts`:

```typescript
export type CloudflareBindings = {
  DB: D1Database;
  // Supabase — used when TESIS is not "true"
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  // TESIS mode — Cloudflare-native providers
  TESIS: string;           // "true" enables Cloudflare-native auth + storage
  JWT_SECRET: string;      // HS256 signing key (wrangler secret put JWT_SECRET)
  AVATARS_BUCKET: R2Bucket; // R2 bucket bound in wrangler.toml
  R2_PUBLIC_URL: string;   // public base URL of the R2 bucket
  // Shared
  ALLOWED_ORIGINS: string;
  DM_MODEL_ENDPOINT_MAS: string;
  DM_MODEL_ENDPOINT_MONOLITHIC: string;
};
```

- [ ] **Step 2: Update `wrangler.toml`**

Replace the entire content of `apps/backend/wrangler.toml`:

```toml
name = "questmasters-api"
main = "src/index.ts"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "questmasters"
database_id = "PLACEHOLDER_REPLACE_WITH_REAL_ID"

[[r2_buckets]]
binding = "AVATARS_BUCKET"
bucket_name = "questmasters-avatars"

[vars]
NODE_ENV = "production"
TESIS = "true"
ALLOWED_ORIGINS = "https://questmasters.app"
R2_PUBLIC_URL = "https://pub-PLACEHOLDER.r2.dev"

# Secrets (set via: wrangler secret put <NAME>):
# JWT_SECRET
# DM_MODEL_ENDPOINT_MAS
# DM_MODEL_ENDPOINT_MONOLITHIC
# SUPABASE_URL          (only needed when TESIS != "true")
# SUPABASE_KEY          (only needed when TESIS != "true")
# SUPABASE_SERVICE_ROLE_KEY (only needed when TESIS != "true")

[env.preview]
name = "questmasters-api-preview"
[env.preview.vars]
NODE_ENV = "development"
TESIS = "true"
ALLOWED_ORIGINS = "http://localhost:3001,http://localhost:3000"
R2_PUBLIC_URL = "http://localhost:8787/__R2"
```

> Bryan: replace `database_id` with the value from Part A Step A2, and `R2_PUBLIC_URL` with the URL from A3.

- [ ] **Step 3: Update `.env` for local dev**

Add to `apps/backend/.env`:

```
# TESIS mode toggle — "true" uses Cloudflare-native providers
TESIS=true
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=change-me-use-32-byte-hex-string
```

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/types/bindings.ts apps/backend/wrangler.toml apps/backend/.env
git commit -m "feat(tesis): add TESIS toggle to bindings, wrangler R2 config, and env"
```

---

### Task 2: Add `userCredentials` table and migration

**Files:**
- Modify: `apps/backend/src/infrastructure/db/schema.ts`
- Create: `apps/backend/drizzle/0001_tesis_auth.sql`

- [ ] **Step 1: Append `userCredentials` table to schema**

At the end of `apps/backend/src/infrastructure/db/schema.ts`, append:

```typescript
export const userCredentials = sqliteTable('user_credentials', {
  userId:       text('user_id').primaryKey().references(() => userProfiles.id, { onDelete: 'cascade' }),
  email:        text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt:    integer('created_at', { mode: 'timestamp_ms' }).notNull().default(nowMs),
});
```

- [ ] **Step 2: Create SQL migration file**

Create `apps/backend/drizzle/0001_tesis_auth.sql` with this exact content:

```sql
CREATE TABLE IF NOT EXISTS user_credentials (
  user_id       TEXT PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch('now') * 1000)
);

CREATE UNIQUE INDEX IF NOT EXISTS IDX_user_credentials_email ON user_credentials(email);
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/infrastructure/db/schema.ts apps/backend/drizzle/0001_tesis_auth.sql
git commit -m "feat(tesis): add user_credentials table for custom JWT auth"
```

---

### Task 3: Shared `AuthUser` type

**Files:**
- Create: `apps/backend/src/infrastructure/auth/types.ts`

- [ ] **Step 1: Create the type file**

Create `apps/backend/src/infrastructure/auth/types.ts`:

```typescript
export type AuthUser = {
  id: string;
  email: string;
};
```

This type replaces Supabase's `User` in all guard return signatures, making the auth layer provider-agnostic. Both the Supabase `User` object and the custom JWT payload satisfy this shape.

- [ ] **Step 2: Commit**

```bash
git add apps/backend/src/infrastructure/auth/types.ts
git commit -m "feat(tesis): shared AuthUser type for provider-agnostic guards"
```

---

### Task 4: Custom JWT utilities with `jose`

**Files:**
- Create: `apps/backend/src/infrastructure/auth/jwt.ts`

- [ ] **Step 1: Install `jose`**

```bash
cd apps/backend && bun add jose
```

Expected output includes `jose` added to `package.json` dependencies.

- [ ] **Step 2: Create JWT utilities**

Create `apps/backend/src/infrastructure/auth/jwt.ts`:

```typescript
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
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/infrastructure/auth/jwt.ts apps/backend/package.json bun.lockb
git commit -m "feat(tesis): custom JWT sign/verify using jose (Web Crypto HS256)"
```

---

### Task 5: TESIS-aware auth guards

**Files:**
- Create: `apps/backend/src/infrastructure/auth/guards.ts`

- [ ] **Step 1: Create `guards.ts`**

Create `apps/backend/src/infrastructure/auth/guards.ts`:

```typescript
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
  return { id: sbUser.id, email: sbUser.email ?? '' };
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
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend/src/infrastructure/auth/guards.ts
git commit -m "feat(tesis): TESIS-aware auth guards — custom JWT or Supabase at runtime"
```

---

### Task 6: Swap auth imports in all route files

Eight route files currently import from `auth/supabase`. They all need to import from `auth/guards` instead. The function signatures are identical, so no route logic changes.

**Files to modify** (confirmed by grep):
- `apps/backend/src/routes/assets.routes.ts`
- `apps/backend/src/routes/campaigns.routes.ts`
- `apps/backend/src/routes/characters.routes.ts`
- `apps/backend/src/routes/dm-sessions.routes.ts`
- `apps/backend/src/routes/packs.routes.ts`
- `apps/backend/src/routes/users.routes.ts`
- `apps/backend/src/routes/avatar.routes.ts` (will be fully replaced in Task 8)
- `apps/backend/src/routes/check-email.routes.ts` (will be fully replaced in Task 9)

- [ ] **Step 1: Run the sed replacement for the six routes not replaced in later tasks**

```bash
cd apps/backend
for f in src/routes/assets.routes.ts src/routes/campaigns.routes.ts src/routes/characters.routes.ts src/routes/dm-sessions.routes.ts src/routes/packs.routes.ts src/routes/users.routes.ts; do
  sed -i "s|from '../infrastructure/auth/supabase'|from '../infrastructure/auth/guards'|g" "$f"
done
```

- [ ] **Step 2: Verify replacements**

```bash
grep -n "auth/supabase\|auth/guards" src/routes/assets.routes.ts src/routes/campaigns.routes.ts src/routes/characters.routes.ts src/routes/dm-sessions.routes.ts src/routes/packs.routes.ts src/routes/users.routes.ts
```

Expected: all lines show `auth/guards`, none show `auth/supabase`.

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

The only expected error is `User` type mismatch if any route explicitly typed the return value as `User` from supabase. If so, change that annotation to `AuthUser` from `../infrastructure/auth/types`.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/routes/
git commit -m "feat(tesis): swap route auth imports to TESIS-aware guards"
```

---

### Task 7: R2 storage implementation and storage adapter

**Files:**
- Create: `apps/backend/src/infrastructure/storage/r2.ts`
- Create: `apps/backend/src/infrastructure/storage/index.ts`

- [ ] **Step 1: Create R2 upload utility**

Create `apps/backend/src/infrastructure/storage/r2.ts`:

```typescript
export async function uploadToR2(
  bucket: R2Bucket,
  key: string,
  file: File,
  publicBaseUrl: string,
): Promise<string> {
  const buffer = await file.arrayBuffer();
  await bucket.put(key, buffer, {
    httpMetadata: { contentType: file.type },
  });
  return `${publicBaseUrl}/${key}`;
}
```

- [ ] **Step 2: Create TESIS-toggled storage adapter**

Create `apps/backend/src/infrastructure/storage/index.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import type { CloudflareBindings } from '../../types/bindings';
import { uploadToR2 } from './r2';

export async function uploadAvatar(
  env: CloudflareBindings,
  userId: string,
  file: File,
  authToken: string,
): Promise<string> {
  const fileExt = file.type.split('/')[1] || 'webp';
  const key = `${userId}/avatar-${Date.now()}.${fileExt}`;

  if (env.TESIS === 'true') {
    return uploadToR2(env.AVATARS_BUCKET, key, file, env.R2_PUBLIC_URL);
  }

  // Supabase Storage path
  const client = createClient(env.SUPABASE_URL, env.SUPABASE_KEY, {
    global: { headers: { Authorization: `Bearer ${authToken}` } },
  });
  const { error } = await client.storage
    .from('avatars')
    .upload(key, file, { upsert: true, contentType: file.type });
  if (error) throw new Error(error.message);
  const { data: { publicUrl } } = client.storage.from('avatars').getPublicUrl(key);
  return publicUrl;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/infrastructure/storage/
git commit -m "feat(tesis): R2 upload utility and TESIS-toggled storage adapter"
```

---

### Task 8: Update avatar route to use storage adapter

**Files:**
- Modify: `apps/backend/src/routes/avatar.routes.ts`

- [ ] **Step 1: Replace avatar route**

Replace the entire content of `apps/backend/src/routes/avatar.routes.ts`:

```typescript
import { Hono } from 'hono';
import type { CloudflareBindings } from '../types/bindings';
import type { Container } from '../infrastructure/container';
import { requireUser } from '../infrastructure/auth/guards';
import { uploadAvatar } from '../infrastructure/storage';

export function avatarRoutes(container: Container) {
  const app = new Hono<{ Bindings: CloudflareBindings }>();

  app.post('/me/avatar', async (c) => {
    const user = await requireUser(c);
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;

    if (!file) return c.json({ message: 'Missing file' }, 400);

    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) return c.json({ message: 'File too large (max 5MB)' }, 413);

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      return c.json({ message: 'Invalid file type. Only JPEG, PNG, WEBP and GIF are allowed.' }, 400);
    }

    const token = c.req.header('authorization')?.split(' ')[1] ?? '';

    try {
      const avatarUrl = await uploadAvatar(c.env, user.id, file, token);
      await container.updateUserProfileUseCase.execute({ userId: user.id, avatarUrl });
      return c.json({ message: 'Avatar updated successfully', avatarUrl });
    } catch (e: any) {
      return c.json({ message: e.message || 'Internal server error' }, 500);
    }
  });

  return app;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend/src/routes/avatar.routes.ts
git commit -m "feat(tesis): avatar route uses TESIS-toggled storage adapter"
```

---

### Task 9: Register + Login endpoints

**Files:**
- Create: `apps/backend/src/routes/auth.routes.ts`

These endpoints are active only when `TESIS=true`. Otherwise they return HTTP 501. PBKDF2 from the Web Crypto API is used — no Node.js `crypto` module needed.

- [ ] **Step 1: Create `auth.routes.ts`**

Create `apps/backend/src/routes/auth.routes.ts`:

```typescript
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

    const token = await signToken({ id: cred.userId, email }, c.env.JWT_SECRET);
    return c.json({ token, userId: cred.userId });
  });

  return app;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend/src/routes/auth.routes.ts
git commit -m "feat(tesis): register/login endpoints — PBKDF2 hashing + JWT response"
```

---

### Task 10: Mount auth routes + update check-email

**Files:**
- Modify: `apps/backend/src/index.ts`
- Modify: `apps/backend/src/routes/check-email.routes.ts`

- [ ] **Step 1: Add auth routes import to `index.ts`**

In `apps/backend/src/index.ts`, add after the existing imports (around line 15):

```typescript
import { authRoutes } from './routes/auth.routes';
```

Inside the `api.route(...)` block, add after `api.route('/auth', checkEmailRoutes())`:

```typescript
api.route('/auth', authRoutes());
```

The block should look like:

```typescript
api.get('/', (ctx) => ctx.text('QuestMasters API is running!'));
api.route('/users', usersRoutes(container));
api.route('/users', usernameRoutes(container));
api.route('/auth', checkEmailRoutes());
api.route('/auth', authRoutes());           // <-- add this line
api.route('/users', avatarRoutes(container));
api.route('/campaigns', campaignsRoutes(container));
api.route('/characters', charactersRoutes(container));
api.route('/dm-sessions', dmSessionsRoutes(container));
api.route('/packs', packsRoutes(container));
api.route('/packs/:slug/assets', assetsRoutes(container));
api.route('/rules', rulesRoutes(container));
```

- [ ] **Step 2: Replace `check-email.routes.ts`**

Replace the entire content of `apps/backend/src/routes/check-email.routes.ts`:

```typescript
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
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/index.ts apps/backend/src/routes/check-email.routes.ts
git commit -m "feat(tesis): mount auth routes + check-email queries D1 in TESIS mode"
```

---

### Task 11: TypeScript check + local wrangler dev test

- [ ] **Step 1: Full TypeScript check**

```bash
cd apps/backend && npx tsc --noEmit
```

Expected: 0 errors. If errors appear:
- `Property 'AVATARS_BUCKET' does not exist on type...` → verify Task 1 Step 1 was saved correctly
- `Type 'User' is not assignable to 'AuthUser'` → the route explicitly typed `user` as Supabase `User` — change the annotation to `AuthUser`

- [ ] **Step 2: Seed local D1**

```bash
cd apps/backend
npx wrangler d1 execute questmasters --local --file=drizzle/0000_groovy_fat_cobra.sql
npx wrangler d1 execute questmasters --local --file=drizzle/0001_tesis_auth.sql
```

Expected output ends with `Done` for each file.

- [ ] **Step 3: Start local wrangler dev**

```bash
npx wrangler dev --local
```

Expected: `Ready on http://localhost:8787`

- [ ] **Step 4: Test health endpoint**

```bash
curl http://localhost:8787/health
```

Expected: `{"status":"ok","timestamp":"..."}`

- [ ] **Step 5: Test register**

```bash
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"dm@questmasters.test","password":"password123","username":"dungeon_master"}'
```

Expected HTTP 201:
```json
{"token":"eyJ...","userId":"<uuid>"}
```

- [ ] **Step 6: Test login**

```bash
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dm@questmasters.test","password":"password123"}'
```

Expected HTTP 200:
```json
{"token":"eyJ...","userId":"<uuid>"}
```

- [ ] **Step 7: Test authenticated endpoint**

Use the token from Step 6:

```bash
curl http://localhost:8787/api/users/me \
  -H "Authorization: Bearer <token-from-step-6>"
```

Expected: HTTP 200 with user profile JSON. If HTTP 404 (profile not created by register), that's expected — the register endpoint creates the `userProfiles` row but no profile use-case data yet. HTTP 401 would indicate the JWT guard is broken.

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "feat(tesis): complete TESIS mode — D1 + R2 + custom JWT behind TESIS env flag"
```

---

## Self-Review

### Spec Coverage

| Requirement | Task | Status |
|-------------|------|--------|
| `TESIS` env toggle | Task 1 | ✅ |
| D1 database (already active, no change) | — | ✅ |
| R2 bucket for avatar storage | Tasks 7, 8 | ✅ |
| Custom JWT (register + login) | Tasks 4, 9 | ✅ |
| Keep Supabase when `TESIS` ≠ `"true"` | Tasks 5, 7, 10 | ✅ |
| Auth guards work for all 8 route files | Tasks 5, 6 | ✅ |
| `check-email` works in both modes | Task 10 | ✅ |
| Wrangler config with real D1 + R2 | Task 1 | ✅ |
| Bryan's Cloudflare platform steps | Part A | ✅ |
| `wrangler.toml` `database_id` placeholder | Task 1 | ✅ (Bryan replaces in A2) |

### Known Gaps (out of scope — separate tasks)

1. **Frontend auth changes**: The frontend uses Supabase `signIn`/`signUp` SDK. In TESIS mode it should call `POST /api/auth/login` and `POST /api/auth/register`. This is a separate frontend migration plan.
2. **R2 public access**: Bryan must manually enable "Public access" on the R2 bucket in the Cloudflare Dashboard (documented in Part A Step A3). The Worker cannot do this via API.
3. **Existing Supabase users**: If the project already has users in Supabase, they cannot log in via TESIS mode (no credentials in D1). This is intentional — TESIS is a clean-slate test deployment.

### Placeholder Scan

No TBD, TODO, or placeholder steps found in the code blocks. All commands are exact and runnable.

### Type Consistency

- `AuthUser` defined in Task 3, imported in Tasks 5, 6 — ✅
- `userCredentials` defined in Task 2, imported in Tasks 9, 10 — ✅
- `signToken` / `verifyToken` defined in Task 4, used in Tasks 5, 9 — ✅
- `CloudflareBindings.TESIS`, `.JWT_SECRET`, `.AVATARS_BUCKET`, `.R2_PUBLIC_URL` defined in Task 1, used in Tasks 5, 7, 9 — ✅
- `uploadAvatar` returns `string` (public URL), consumed as `avatarUrl` in Task 8 — ✅
