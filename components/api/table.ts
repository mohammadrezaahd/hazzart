import type { AdminCategory } from "@/interfaces/Category";
import type { AdminTableItem, AdminTableSettings } from "@/interfaces/Table";
import { apiClient } from "./client";

export async function getAdminTableItems() {
  const response = await apiClient.get<{ items: AdminTableItem[] }>("/api/admin/table", { params: { _: Date.now() } });
  return response.data.items;
}
export async function unstarAdminTableItem(id: string) {
  await apiClient.delete("/api/admin/table/" + encodeURIComponent(id));
}
export async function updateAdminTableItem(id: string, description: string) {
  const response = await apiClient.put<{ item: AdminTableItem }>("/api/admin/table/" + id, { description });
  return response.data.item;
}
export async function getAdminTableSettings() {
  const response = await apiClient.get<{ settings: AdminTableSettings }>("/api/admin/table/settings", { params: { _: Date.now() } });
  return response.data.settings;
}
export async function updateAdminTableSettings(categoryIds: string[]) {
  const response = await apiClient.put<{ settings: AdminTableSettings }>("/api/admin/table/settings", { categoryIds });
  return response.data.settings;
}