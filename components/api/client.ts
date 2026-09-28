import axios from "axios";

export const apiClient = axios.create({
  headers: {
    Accept: "application/json",
  },
});

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ error?: string; message?: string }>(error)) {
    return error.response?.data?.error || error.response?.data?.message || fallback;
  }

  return error instanceof Error ? error.message : fallback;
}
