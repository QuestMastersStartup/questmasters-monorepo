import { supabase } from "../lib/supabase";
import { type AbilityScores } from "@questmasters/dnd-rules";

export interface Character {
  id: string;
  campaignId: string | null;
  userId: string;
  name: string;
  raceAssetId: string;
  classAssetId: string;
  backgroundAssetId: string | null;
  level: number;
  stats: AbilityScores;
  hitPoints: number;
  portraitUrl: string | null;
  backstory: string | null;
  status: string;
  choices: Record<string, any> | null;
  // Enriched fields (resolved from assets)
  raceName: string | null;
  className: string | null;
  backgroundName: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Character enriquecido con campaignName — devuelto por GET /characters/me */
export interface MyCharacter extends Character {
  campaignName: string | null;
}

export interface CreateCharacterRequest {
  campaignId?: string;
  name: string;
  raceAssetId?: string | null;
  classAssetId?: string | null;
  backgroundAssetId?: string | null;
  stats: AbilityScores;
  portraitUrl?: string;
  backstory?: string;
  choices?: Record<string, any>;
  method: 'point-buy' | 'free' | 'libre';
  hitPoints?: number;
}

export interface UpdateCharacterRequest {
  name?: string;
  backstory?: string | null;
  portraitUrl?: string | null;
  choices?: Record<string, any> | null;
  raceAssetId?: string | null;
  classAssetId?: string | null;
  backgroundAssetId?: string | null;
  stats?: AbilityScores;
  level?: number;
  hitPoints?: number;
  status?: 'active' | 'dead' | 'retired';
}

export interface Asset {
  id: string;
  packId: string;
  type: string;
  index: string;
  name: string;
  data: any;
  compatibleWith: string[];
}

export interface AvailableAssetsResponse {
  races: Asset[];
  subraces: Asset[];
  classes: Asset[];
  backgrounds: Asset[];
}

async function getHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }
  
  return headers;
}

export async function createCharacter(data: CreateCharacterRequest): Promise<Character> {
  const response = await fetch("/api/characters", {
    method: "POST",
    headers: await getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Error al crear el personaje");
  }

  return response.json();
}

export async function fetchCharacter(id: string): Promise<Character> {
  const response = await fetch(`/api/characters/${id}`, {
    headers: await getHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Personaje no encontrado");
  }

  return response.json();
}

export async function updateCharacter(id: string, data: UpdateCharacterRequest): Promise<Character> {
  const response = await fetch(`/api/characters/${id}`, {
    method: "PUT",
    headers: await getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Error al actualizar el personaje");
  }

  return response.json();
}

export async function deleteCharacter(id: string): Promise<void> {
  const response = await fetch(`/api/characters/${id}`, {
    method: "DELETE",
    headers: await getHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Error al eliminar el personaje");
  }
}

export async function fetchAvailableAssets(filters: {
  campaignId?: string;
  type?: string;
  query?: string;
  /** Vanilla mode: filter by system (e.g. 'dnd-5e-2024') */
  system?: string;
  /** Personalizado mode: specific pack IDs */
  packIds?: string[];
}): Promise<AvailableAssetsResponse> {
  const params = new URLSearchParams();
  if (filters.campaignId) params.append("campaignId", filters.campaignId);
  if (filters.type) params.append("type", filters.type);
  if (filters.query) params.append("query", filters.query);
  if (filters.system) params.append("system", filters.system);
  if (filters.packIds?.length) params.append("packIds", filters.packIds.join(","));

  const response = await fetch(`/api/characters/available-assets?${params.toString()}`, {
    headers: await getHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Error al cargar assets");
  }

  return response.json();
}

export async function fetchCharacters(filters: {
  campaignId?: string;
}): Promise<Character[]> {
  const params = new URLSearchParams();
  if (filters.campaignId) params.append("campaignId", filters.campaignId);

  const response = await fetch(`/api/characters?${params.toString()}`, {
    headers: await getHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Error al listar personajes");
  }

  return response.json();
}

/** Devuelve todos los personajes del usuario autenticado con campaignName resuelto.
 *  Llama a GET /characters (sin campaignId) que activa la rama "Mis Personajes"
 *  del backend e incluye el campo campaignName en cada item. */
export async function fetchMyCharacters(): Promise<MyCharacter[]> {
  const response = await fetch("/api/characters", {
    headers: await getHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Error al listar tus personajes");
  }

  return response.json();
}

export async function uploadCharacterPortrait(file: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("file", file, "character-portrait.webp");

  const headers = await getHeaders();
  delete headers["Content-Type"];

  const response = await fetch("/api/campaigns/portrait", {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Error al subir retrato");
  }

  const data = await response.json();
  return data.portraitUrl;
}
