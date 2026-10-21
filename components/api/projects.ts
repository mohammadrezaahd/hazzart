import type { AdminProject, AdminProjectStatus as PublicationStatus } from "@/interfaces/Project";
import type { AdminProjectStatus } from "@/interfaces/ProjectStatus";
import { apiClient } from "./client";
import { uploadAdminImage } from "./admin-image-upload";

export interface ProjectFilters {
  search?: string;
  status?: "draft" | "published" | "archived";
}

export async function getAdminProjects(filters: ProjectFilters = {}) {
  const r = await apiClient.get<{ projects: AdminProject[] }>("/api/admin/projects", {
    params: { ...filters, _: Date.now() },
  });
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
  removeImageIds?: string[];
  links: { id: string; title: string; link: string }[];
  dynamicFields: Record<string, string>;
}

async function buildPayload(input: ProjectInput) {
  const { images, removeImageIds, ...data } = input;
  const uploadedImages = await Promise.all(images.map((image) => uploadAdminImage(image, "project")));
  return { data, images: uploadedImages, removeImageIds: removeImageIds ?? [] };
}

export async function createAdminProject(input: ProjectInput) {
  const payload = await buildPayload(input);
  const r = await apiClient.post<{ project: AdminProject }>("/api/admin/projects", payload);
  return r.data.project;
}

export async function updateAdminProject(id: string, input: Omit<ProjectInput, "images"> & { images?: File[]; removeImageIds?: string[] }) {
  const payload = await buildPayload({ ...input, images: input.images ?? [] });
  const r = await apiClient.put<{ project: AdminProject }>("/api/admin/projects/" + id, payload);
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


export async function updateAdminProjectPublicationStatus(id: string, status: PublicationStatus) {
  const r = await apiClient.patch<{ project: AdminProject }>("/api/admin/projects/" + id, { status });
  return r.data.project;
}
