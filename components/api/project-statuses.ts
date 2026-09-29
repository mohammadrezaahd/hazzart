import type { AdminProjectStatus } from "@/interfaces/ProjectStatus"; import { apiClient } from "./client";
export async function getAdminProjectStatuses(){const r=await apiClient.get<{statuses:AdminProjectStatus[]}>("/api/admin/project-statuses",{params:{_:Date.now()}});return r.data.statuses;}
export async function createAdminProjectStatus(name:string){const r=await apiClient.post<{status:AdminProjectStatus}>("/api/admin/project-statuses",{name});return r.data.status;}
export async function updateAdminProjectStatus(id:string,name:string){const r=await apiClient.put<{status:AdminProjectStatus}>("/api/admin/project-statuses/"+id,{name});return r.data.status;}
export async function deleteAdminProjectStatus(id:string){await apiClient.delete("/api/admin/project-statuses/"+id);}