export type CloudflareBindings = {
  DB: D1Database;
  // Supabase — used when TESIS is not "true"
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  // TESIS mode — Cloudflare-native providers
  TESIS: string;            // "true" enables Cloudflare-native auth + storage
  JWT_SECRET: string;       // HS256 signing key (wrangler secret put JWT_SECRET)
  AVATARS_BUCKET: R2Bucket; // R2 bucket bound in wrangler.toml
  R2_PUBLIC_URL: string;    // public base URL of the R2 bucket
  // Shared
  ALLOWED_ORIGINS: string;
  DM_MODEL_ENDPOINT_MAS: string;
  DM_MODEL_ENDPOINT_MONOLITHIC: string;
};
