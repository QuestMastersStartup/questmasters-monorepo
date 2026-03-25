export interface Pack {
  id: string;
  slug: string;
  name: string;
  description: string;
  type: string;
  version: string;
  system: string;
  author: string;
  creatorId: string;
}

import type { AssetData } from "@questmasters/dnd-rules";

export interface CreatePackRequest {
  name: string;
  slug: string; // Added
  creatorId: string; // Added
  description: string;
  system?: string; // Optional (Universal default)
  version: string;
  type: string;
  assets?: {
    type: string;
    data: AssetData;
  }[];
}

export async function fetchPacks(): Promise<Pack[]> {
  try {
    const response = await fetch("/api/packs");
    if (!response.ok) {
      const text = await response.text();
      console.error(
        `Fetch failed: ${response.status} ${response.statusText}`,
        text,
      );
      throw new Error(
        `Failed to fetch packs: ${response.status} ${response.statusText}`,
      );
    }
    return response.json();
  } catch (err) {
    console.error("Network error fetching packs:", err);
    throw err;
  }
}

export async function createPack(data: CreatePackRequest): Promise<Pack> {
  const response = await fetch("/api/packs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return response.json();
}

export type UpdatePackRequest = Partial<CreatePackRequest>;

export async function updatePack(
  slug: string,
  data: UpdatePackRequest,
): Promise<Pack> {
  const response = await fetch(`/api/packs/${slug}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = Array.isArray(errorData.message)
      ? errorData.message.join(", ")
      : errorData.message || "Failed to update pack";
    throw new Error(errorMessage);
  }

  return response.json();
}

export interface Asset {
  id: string;
  type: string;
  index: string;
  name: string;
  data: AssetData;
}

export interface PackWithAssets extends Pack {
  assets: Asset[];
}

export async function fetchPack(slug: string): Promise<PackWithAssets> {
  const response = await fetch(`/api/packs/${slug}`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Pack not found");
    }
    const text = await response.text();
    throw new Error(
      `Failed to fetch pack: ${response.status} ${response.statusText} - ${text}`,
    );
  }
  return response.json();
}

export async function deletePack(slug: string): Promise<void> {
  const response = await fetch(`/api/packs/${slug}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete pack");
  }
}

export interface CreateAssetRequest {
  type: string;
  index: string;
  data: Record<string, unknown>;
}

export async function createAsset(
  slug: string,
  data: CreateAssetRequest,
): Promise<Asset> {
  const response = await fetch(`/api/packs/${slug}/assets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = Array.isArray(errorData.message)
      ? errorData.message.join(", ")
      : errorData.message || "Failed to create asset";
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function fetchAssetsByType(
  slug: string,
  type: string,
): Promise<Asset[]> {
  const response = await fetch(`/api/packs/${slug}/assets?type=${encodeURIComponent(type)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch assets: ${response.status}`);
  }
  return response.json();
}
