/**
 * US-0.7 — Validación de configuración
 * Validates required environment variables at startup.
 * Fails fast with a clear error message if any required var is missing.
 */

interface Env {
  DATABASE_URL: string;
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: string;
  ALLOWED_ORIGINS: string | undefined;
  DB_SSL: string | undefined;
}

const REQUIRED_VARS = [
  'DATABASE_URL',
  'SUPABASE_URL',
  'SUPABASE_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

export function validateEnv(): Env {
  const missing: string[] = [];

  for (const key of REQUIRED_VARS) {
    const value = Bun.env[key] ?? process.env[key];
    if (!value || value.trim() === '') {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    const list = missing.map((k) => `  - ${k}`).join('\n');
    throw new Error(
      `\n❌ Missing required environment variables:\n${list}\n\n` +
        `Make sure your .env file is present and contains all required variables.\n`,
    );
  }

  const nodeEnv = (Bun.env.NODE_ENV ?? process.env.NODE_ENV ?? 'development') as Env['NODE_ENV'];
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    throw new Error(`❌ Invalid NODE_ENV value: "${nodeEnv}". Must be development, production, or test.`);
  }

  return {
    DATABASE_URL: (Bun.env.DATABASE_URL ?? process.env.DATABASE_URL)!,
    SUPABASE_URL: (Bun.env.SUPABASE_URL ?? process.env.SUPABASE_URL)!,
    SUPABASE_KEY: (Bun.env.SUPABASE_KEY ?? process.env.SUPABASE_KEY)!,
    SUPABASE_SERVICE_ROLE_KEY: (Bun.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY)!,
    NODE_ENV: nodeEnv,
    PORT: Bun.env.PORT ?? process.env.PORT ?? '3000',
    ALLOWED_ORIGINS: Bun.env.ALLOWED_ORIGINS ?? process.env.ALLOWED_ORIGINS,
    DB_SSL: Bun.env.DB_SSL ?? process.env.DB_SSL,
  };
}

// Export a validated singleton — fails at module load if env is bad
export const env = validateEnv();
