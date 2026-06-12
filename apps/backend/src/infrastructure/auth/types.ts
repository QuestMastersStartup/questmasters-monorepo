export type AuthUser = {
  id: string;
  email: string;
  username?: string; // populated from Supabase user_metadata or from TESIS registration
};
