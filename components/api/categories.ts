import type { AdminCategory } from "@/interfaces/Category";
import { apiClient } from "./client";

export async function getAdminCategories() {
  const response = await apiClient.get<{ categories: AdminCategory[] }>("/api/admin/categories", {
    params: { _: Date.now() },
  });
  return response.data.categories;
}

export async function createAdminCategory(name: string, parentId: string | null) {
  const response = await apiClient.post<{ category: AdminCategory }>("/api/admin/categories", { name, parentId });
  return response.data.category;
}

export async function updateAdminCategory(id: string, name: string) {
  const response = await apiClient.put<{ category: AdminCategory }>(`/api/admin/categories/${id}`, { name });
  return response.data.category;
}

export async function deleteAdminCategory(id: string) {
  await apiClient.delete(`/api/admin/categories/${id}`);
}
