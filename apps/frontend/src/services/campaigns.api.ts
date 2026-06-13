import { authFetch } from "../lib/api";

export interface Campaign {
  id: string;
  name: string;
  description: string;
  system: string;
  coverImageUrl: string | null;
  dmId: string;
  status: 'active' | 'paused' | 'completed';
  installedPackIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CampaignMember {
  campaignId: string;
  userId: string;
  role: 'dm' | 'player';
  joinedAt: string;
  user?: {
    username: string;
    avatarUrl?: string;
  };
}

export interface CreateCampaignRequest {
  name: string;
  description?: string;
  system: string;
  coverImageUrl?: string | null;
  installedPackIds?: string[];
}

export type UpdateCampaignRequest = Partial<CreateCampaignRequest>;

export async function fetchCampaigns(): Promise<Campaign[]> {
  const response = await authFetch("/api/campaigns");
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to fetch campaigns");
  }
  return response.json();
}

export async function fetchCampaign(id: string): Promise<Campaign> {
  const response = await authFetch(`/api/campaigns/${id}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Campaign not found");
  }
  return response.json();
}

export async function createCampaign(data: CreateCampaignRequest): Promise<Campaign> {
  const response = await authFetch("/api/campaigns", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create campaign");
  }
  return response.json();
}

export async function updateCampaign(id: string, data: UpdateCampaignRequest): Promise<Campaign> {
  const response = await authFetch(`/api/campaigns/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update campaign");
  }
  return response.json();
}

export async function installPacks(id: string, packIds: string[]): Promise<Campaign> {
  const response = await authFetch(`/api/campaigns/${id}/packs`, {
    method: "POST",
    body: JSON.stringify({ packIds }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to install packs");
  }
  return response.json();
}

export async function uninstallPacks(id: string, packIds: string[]): Promise<Campaign> {
  const response = await authFetch(`/api/campaigns/${id}/packs/uninstall`, {
    method: "POST",
    body: JSON.stringify({ packIds }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to uninstall packs");
  }
  return response.json();
}

export async function deleteCampaign(id: string): Promise<void> {
  const response = await authFetch(`/api/campaigns/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to delete campaign");
  }
}

export async function changeCampaignStatus(id: string, status: string): Promise<Campaign> {
  const response = await authFetch(`/api/campaigns/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to change campaign status");
  }
  return response.json();
}

export async function uploadCampaignPortrait(file: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("file", file, "portrait.webp");
  const response = await authFetch("/api/campaigns/portrait", {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to upload portrait");
  }
  const data = await response.json();
  return data.portraitUrl;
}

export async function fetchMembers(campaignId: string): Promise<CampaignMember[]> {
  const response = await authFetch(`/api/campaigns/${campaignId}/members`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to fetch members");
  }
  return response.json();
}

export async function invitePlayer(campaignId: string, userId: string): Promise<CampaignMember> {
  const response = await authFetch(`/api/campaigns/${campaignId}/members`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to invite player");
  }
  return response.json();
}

export async function removeMember(campaignId: string, userId: string): Promise<void> {
  const response = await authFetch(`/api/campaigns/${campaignId}/members/${userId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to remove member");
  }
}
