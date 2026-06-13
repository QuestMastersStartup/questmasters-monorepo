import { authFetch } from "../lib/api";
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
  raceName: string | null;
  className: string | null;
  backgroundName: string | null;
  createdAt: string;
  updatedAt: string;
}

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

export async function createCharacter(data: CreateCharacterRequest): Promise<Character> {
  const response = await authFetch("/api/characters", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Error al crear el personaje");
  }
  return response.json();
}

export async function fetchCharacter(id: string): Promise<Character> {
  const response = await authFetch(`/api/characters/${id}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Personaje no encontrado");
  }
  return response.json();
}

export async function updateCharacter(id: string, data: UpdateCharacterRequest): Promise<Character> {
  const response = await authFetch(`/api/characters/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Error al actualizar el personaje");
  }
  return response.json();
}

export async function deleteCharacter(id: string): Promise<void> {
  const response = await authFetch(`/api/characters/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Error al eliminar el personaje");
  }
}

export async function fetchAvailableAssets(filters: {
  campaignId?: string;
  type?: string;
  query?: string;
  system?: string;
  packIds?: string[];
}): Promise<AvailableAssetsResponse> {
  const params = new URLSearchParams();
  if (filters.campaignId) params.append("campaignId", filters.campaignId);
  if (filters.type) params.append("type", filters.type);
  if (filters.query) params.append("query", filters.query);
  if (filters.system) params.append("system", filters.system);
  if (filters.packIds?.length) params.append("packIds", filters.packIds.join(","));

  const response = await authFetch(`/api/characters/available-assets?${params.toString()}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Error al cargar assets");
  }
  return response.json();
}

export async function fetchCharacters(filters: { campaignId?: string }): Promise<Character[]> {
  const params = new URLSearchParams();
  if (filters.campaignId) params.append("campaignId", filters.campaignId);

  const response = await authFetch(`/api/characters?${params.toString()}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Error al listar personajes");
  }
  return response.json();
}

export async function fetchMyCharacters(): Promise<MyCharacter[]> {
  const response = await authFetch("/api/characters");
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Error al listar tus personajes");
  }
  return response.json();
}

export async function uploadCharacterPortrait(file: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("file", file, "character-portrait.webp");
  const response = await authFetch("/api/characters/portrait", {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Error al subir retrato");
  }
  const data = await response.json();
  return data.portraitUrl;
}
