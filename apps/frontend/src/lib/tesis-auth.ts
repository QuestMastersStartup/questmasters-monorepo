const TOKEN_KEY = 'tesis_token';
const USER_KEY = 'tesis_user';

export interface TesisUser {
  id: string;
  email: string;
  username: string;
}

export function isTesisMode(): boolean {
  return import.meta.env.VITE_TESIS_MODE === 'true';
}

export function getTesisToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getTesisUser(): TesisUser | null {
  const raw = localStorage.getItem(USER_KEY);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setTesisSession(token: string, user: TesisUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearTesisSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
