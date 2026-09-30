import type { AdminPainting, AdminPaintingsPayload } from "@/interfaces/Painting";
import { apiClient } from "./client";

export interface PaintingFilters {
  search?: string;
  categoryId?: string;
  from?: string;
  to?: string;
  status?: "draft" | "published" | "archived";
}

export async function getAdminPaintings(filters: PaintingFilters) {
  const response = await apiClient.get<AdminPaintingsPayload>("/api/admin/paintings", {
    params: { ...filters, _: Date.now() },
  });
  return response.data;
}

function buildPaintingFormData(input: {
  name: string;
  description: string;
  completedDate: string;
  categoryIds: string[];
  status: "draft" | "published" | "archived";
  image1?: File | null;
  image2?: File | null;
}) {
  const formData = new FormData();
  formData.append("name", input.name);
  formData.append("description", input.description);
  formData.append("completedDate", input.completedDate);
  formData.append("categoryIds", JSON.stringify(input.categoryIds));
  formData.append("status", input.status);

  if (input.image1) formData.append("image1", input.image1);
  if (input.image2) formData.append("image2", input.image2);

  return formData;
}

export async function createAdminPainting(input: {
  name: string;
  description: string;
  completedDate: string;
  categoryIds: string[];
  status: "draft" | "published" | "archived";
  image1: File;
  image2: File;
}) {
  const response = await apiClient.post<{ painting: AdminPainting }>(
    "/api/admin/paintings",
    buildPaintingFormData(input),
  );
  return response.data.painting;
}

export async function updateAdminPainting(
  id: string,
  input: {
    name: string;
    description: string;
    completedDate: string;
    categoryIds: string[];
    status: "draft" | "published" | "archived";
    image1?: File | null;
    image2?: File | null;
  },
) {
  const response = await apiClient.put<{ painting: AdminPainting }>(
    "/api/admin/paintings/" + id,
    buildPaintingFormData(input),
  );
  return response.data.painting;
}

export async function deleteAdminPainting(id: string) {
  await apiClient.delete("/api/admin/paintings/" + id);
}


export async function setAdminPaintingImageStar(
  paintingId: string,
  fileId: string,
  starred: boolean,
) {
  const response = await apiClient.post<{ painting: AdminPainting }>("/api/admin/paintings/star", {
    paintingId,
    fileId,
    starred,
  });
  return response.data.painting;
}


export async function updateAdminPaintingStatus(id: string, status: "draft" | "published" | "archived") {
  const response = await apiClient.patch<{ painting: AdminPainting }>(
    "/api/admin/paintings/" + id,
    { status },
  );
  return response.data.painting;
}
