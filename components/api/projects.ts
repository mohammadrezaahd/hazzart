import type { AdminProject } from "@/interfaces/Project"; import { apiClient } from "./client";
export async function getAdminProjects(){const r=await apiClient.get<{projects:AdminProject[]}>("/api/admin/projects",{params:{_:Date.now()}});return r.data.projects;}
export async function createAdminProject(payload:Omit<AdminProject,"id"|"createdAt"|"updatedAt">){const r=await apiClient.post<{project:AdminProject}>("/api/admin/projects",payload);return r.data.project;}
export async function updateAdminProject(id:string,payload:Omit<AdminProject,"id"|"createdAt"|"updatedAt">){const r=await apiClient.put<{project:AdminProject}>("/api/admin/projects/"+id,payload);return r.data.project;}
export async function deleteAdminProject(id:string){await apiClient.delete("/api/admin/projects/"+id);}