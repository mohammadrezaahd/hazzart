import { apiClient } from "./client";

export async function loginAdmin(apiUrl: string, values: { username: string; password: string }) {
  const loginUrl = apiUrl.replace(/\/$/, "") + "/admin/auth/login";
  return apiClient.post<{ message?: string }>(loginUrl, values, {
    headers: { "Content-Type": "application/json" },
  });
}
