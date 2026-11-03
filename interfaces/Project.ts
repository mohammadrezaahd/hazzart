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
  description: string;
  /** Website publication status shared with paintings. */
  status: AdminProjectStatus;
  /** Internal workflow status for this project. */
  projectStatusId: string;
  projectStatusName?: string;
  images: AdminProjectImage[];
  links: AdminProjectLink[];
  createdAt: string;
  updatedAt: string;
}
