export type CloudflareBindings = {
  DB: D1Database;
  JWT_SECRET: string;
  AVATARS_BUCKET: R2Bucket;
  R2_PUBLIC_URL: string;
  ALLOWED_ORIGINS: string;
  DM_MODEL_ENDPOINT_MAS: string;
  DM_MODEL_ENDPOINT_MONOLITHIC: string;
  // RunPod Serverless — requiere DM_USE_RUNPOD="true" para activarse
  DM_USE_RUNPOD: string;
  RUNPOD_ENDPOINT_ID: string;
  RUNPOD_API_KEY: string;
  GROQ_API_KEY: string;
};
