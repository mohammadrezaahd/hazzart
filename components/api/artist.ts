import type { ArtistAdminPayload, ArtistContactSocial, ArtistSocialPlatform } from "@/interfaces/Artist";
import { apiClient } from "./client";

export async function getAdminArtist() {
  const response = await apiClient.get<ArtistAdminPayload>("/api/admin/artist", {
    params: { _: Date.now() },
  });
  return response.data;
}

export async function updateAdminArtist(cvText: string, contactText: string, socials: ArtistContactSocial[]) {
  const response = await apiClient.put<{ content: ArtistAdminPayload["content"] }>("/api/admin/artist", {
    cvText,
    contactText,
    socials,
  });
  return response.data.content;
}

export async function createArtistSocialPlatform(formData: FormData) {
  const response = await apiClient.post<{ platform: ArtistSocialPlatform }>("/api/admin/artist", formData);
  return response.data.platform;
}

export async function deleteArtistSocialPlatform(id: string) {
  await apiClient.delete(`/api/admin/artist/social-platforms/${id}`);
}
