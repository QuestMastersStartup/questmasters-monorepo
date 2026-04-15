import { supabase } from "./supabase";

/**
 * Wrapper sobre fetch que siempre obtiene el token más reciente de Supabase
 * antes de hacer la petición. El SDK de Supabase auto-refresca el token si
 * está expirado, así que getSession() garantiza un access_token válido.
 *
 * Uso: reemplaza fetch('/api/...', { headers: { Authorization: `Bearer ${session.access_token}` } })
 *      por  authFetch('/api/...', { method: 'GET' })
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session) {
    throw new Error("No active session — user is not authenticated");
  }

  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${session.access_token}`,
    ...(options.headers as Record<string, string>),
  };

  // Solo setear Content-Type para JSON; FormData necesita que el browser lo ponga solo
  if (!isFormData && options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(url, { ...options, headers });
}
