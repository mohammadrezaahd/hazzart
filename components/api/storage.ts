import type { AdminStorage } from "@/interfaces/Storage";
import { apiClient } from "./client";

export async function getAdminStorage() {
  const response = await apiClient.get<AdminStorage>("/api/admin/storage", {
    params: { _: Date.now() },
  });
  return response.data;
}
