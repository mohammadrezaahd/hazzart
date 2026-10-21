import type { AdminPainting, AdminPaintingsPayload } from "@/interfaces/Painting";
import { apiClient } from "./client";
import { uploadAdminImage, type UploadedAdminImage } from "./admin-image-upload";

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

async function buildPaintingPayload(input: {
  name: string; description: string; completedDate: string; categoryIds: string[];
  status: "draft" | "published" | "archived"; image1?: File | null; image2?: File | null;
}, required: boolean) {
  const images: (UploadedAdminImage | null)[] = await Promise.all([
    input.image1 ? uploadAdminImage(input.image1, "painting") : Promise.resolve(null),
    input.image2 ? uploadAdminImage(input.image2, "painting") : Promise.resolve(null),
  ]);
  if (required && images.some((image) => !image)) throw new Error("Two painting images are required.");
  return { name: input.name, description: input.description, completedDate: input.completedDate, categoryIds: input.categoryIds, status: input.status, images };
}

export async function createAdminPainting(input: {
  name: string; description: string; completedDate: string; categoryIds: string[];
  status: "draft" | "published" | "archived"; image1: File; image2: File;
}) {
  const payload = await buildPaintingPayload(input, true);
  const response = await apiClient.post<{ painting: AdminPainting }>("/api/admin/paintings", payload);
  return response.data.painting;
}

export async function updateAdminPainting(id: string, input: {
  name: string; description: string; completedDate: string; categoryIds: string[];
  status: "draft" | "published" | "archived"; image1?: File | null; image2?: File | null;
}) {
  const payload = await buildPaintingPayload(input, false);
  const response = await apiClient.put<{ painting: AdminPainting }>("/api/admin/paintings/" + id, payload);
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
