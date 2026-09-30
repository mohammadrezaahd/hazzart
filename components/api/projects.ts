import type { AdminProject } from "@/interfaces/Project";
import type { AdminProjectStatus } from "@/interfaces/ProjectStatus";
import { apiClient } from "./client";

export async function getAdminProjects() {
  const r = await apiClient.get<{ projects: AdminProject[] }>("/api/admin/projects", { params: { _: Date.now() } });
  return r.data.projects;
}

interface ProjectInput {
  title: string;
  myRole: string;
  started: string;
  ended: string;
  medium: string[];
  status: "draft" | "published" | "archived";
  projectStatusId: string;
  images: File[];
  links: { id: string; title: string; link: string }[];
  dynamicFields: Record<string, string>;
}

function buildFormData(input: ProjectInput) {
  const formData = new FormData();
  const { images, ...data } = input;
  formData.append("data", JSON.stringify(data));
  images.forEach((image) => formData.append("images", image));
  return formData;
}

export async function createAdminProject(input: ProjectInput) {
  const r = await apiClient.post<{ project: AdminProject }>("/api/admin/projects", buildFormData(input));
  return r.data.project;
}

export async function updateAdminProject(id: string, input: Omit<ProjectInput, "images"> & { images?: File[] }) {
  const r = await apiClient.put<{ project: AdminProject }>("/api/admin/projects/" + id, buildFormData({ ...input, images: input.images ?? [] }));
  return r.data.project;
}

export async function deleteAdminProject(id: string) {
  await apiClient.delete("/api/admin/projects/" + id);
}

export async function getAdminProjectStatuses() {
  const r = await apiClient.get<{ statuses: AdminProjectStatus[] }>("/api/admin/project-statuses", { params: { _: Date.now() } });
  return r.data.statuses;
}

export async function createAdminProjectStatus(name: string) {
  const r = await apiClient.post<{ status: AdminProjectStatus }>("/api/admin/project-statuses", { name });
  return r.data.status;
}

export async function updateAdminProjectStatus(id: string, name: string) {
  const r = await apiClient.put<{ status: AdminProjectStatus }>("/api/admin/project-statuses/" + id, { name });
  return r.data.status;
}

export async function deleteAdminProjectStatus(id: string) {
  await apiClient.delete("/api/admin/project-statuses/" + id);
}
