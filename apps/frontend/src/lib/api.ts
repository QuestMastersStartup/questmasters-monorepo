import { supabase } from "./supabase";
import { isTesisMode, getTesisToken } from "./tesis-auth";

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const isFormData = options.body instanceof FormData;

  if (isTesisMode()) {
    const token = getTesisToken();
    if (!token) throw new Error("No TESIS token — please log in first");

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      ...(options.headers as Record<string, string>),
    };
    if (!isFormData && options.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    return fetch(url, { ...options, headers });
  }

  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    throw new Error("No active session — user is not authenticated");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${session.access_token}`,
    ...(options.headers as Record<string, string>),
  };
  if (!isFormData && options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  return fetch(url, { ...options, headers });
}
