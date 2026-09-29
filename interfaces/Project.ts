export type AdminProjectStatus = "draft" | "published" | "archived";

export interface AdminProjectImage {
  id: string;
  fileId: string;
  url: string;
  name: string;
  contentType: string;
  size: number;
}

export interface AdminProjectLink {
  id: string;
  title: string;
  link: string;
}

export interface AdminProject {
  id: string;
  title: string;
  myRole: string;
  started: string;
  ended: string | null;
  medium: string[];
  status: AdminProjectStatus;
  images: AdminProjectImage[];
  links: AdminProjectLink[];
  dynamicFields: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}