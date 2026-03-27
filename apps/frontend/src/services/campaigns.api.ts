import { supabase } from "../lib/supabase";

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

export async function fetchCampaigns(): Promise<Campaign[]> {
  const response = await fetch("/api/campaigns", {
    headers: await getHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch campaigns");
  }
  return response.json();
}

export async function fetchCampaign(id: string): Promise<Campaign> {
  const response = await fetch(`/api/campaigns/${id}`, {
    headers: await getHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Campaign not found");
  }
  return response.json();
}

export async function createCampaign(data: CreateCampaignRequest): Promise<Campaign> {
  const response = await fetch("/api/campaigns", {
    method: "POST",
    headers: await getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to create campaign");
  }

  return response.json();
}

export async function updateCampaign(id: string, data: UpdateCampaignRequest): Promise<Campaign> {
  const response = await fetch(`/api/campaigns/${id}`, {
    method: "PUT",
    headers: await getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update campaign");
  }

  return response.json();
}

export async function installPacks(id: string, packIds: string[]): Promise<Campaign> {
  const response = await fetch(`/api/campaigns/${id}/packs`, {
    method: "POST",
    headers: await getHeaders(),
    body: JSON.stringify({ packIds }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to install packs");
  }

  return response.json();
}

export async function uninstallPacks(id: string, packIds: string[]): Promise<Campaign> {
  const response = await fetch(`/api/campaigns/${id}/packs`, {
    method: "DELETE",
    headers: await getHeaders(),
    body: JSON.stringify({ packIds }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to uninstall packs");
  }

  return response.json();
}

export async function deleteCampaign(id: string): Promise<void> {
  const response = await fetch(`/api/campaigns/${id}`, {
    method: "DELETE",
    headers: await getHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to delete campaign");
  }
}

export async function changeCampaignStatus(id: string, status: string): Promise<Campaign> {
  const response = await fetch(`/api/campaigns/${id}/status`, {
    method: "PATCH",
    headers: await getHeaders(),
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to change campaign status");
  }

  return response.json();
}

export async function uploadCampaignPortrait(file: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("file", file, "portrait.webp");

  const headers = await getHeaders();
  // Fetch handles Content-Type for FormData automatically
  delete headers["Content-Type"];

  const response = await fetch("/api/campaigns/portrait", {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to upload portrait");
  }

  const data = await response.json();
  return data.portraitUrl;
}

export async function fetchMembers(campaignId: string): Promise<CampaignMember[]> {
  const response = await fetch(`/api/campaigns/${campaignId}/members`, {
    headers: await getHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to fetch members");
  }
  return response.json();
}

export async function invitePlayer(campaignId: string, userId: string): Promise<CampaignMember> {
  const response = await fetch(`/api/campaigns/${campaignId}/members`, {
    method: "POST",
    headers: await getHeaders(),
    body: JSON.stringify({ userId }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to invite player");
  }
  return response.json();
}

export async function removeMember(campaignId: string, userId: string): Promise<void> {
  const response = await fetch(`/api/campaigns/${campaignId}/members/${userId}`, {
    method: "DELETE",
    headers: await getHeaders(),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to remove member");
  }
}
