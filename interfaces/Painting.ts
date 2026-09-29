export type AdminPaintingStatus = "draft" | "published" | "archived";

export interface AdminPaintingImage {
  fileId: string;
  url: string;
  name: string;
  contentType: string;
  size: number;
  starred?: boolean;
  tableDescription?: string;
  updatedAt?: string;
}

export interface AdminPainting {
  id: string;
  name: string;
  description: string;
  completedDate: string;
  categoryIds: string[];
  status: AdminPaintingStatus;
  images: [AdminPaintingImage, AdminPaintingImage];
  createdAt: string;
  updatedAt: string;
}

export interface AdminPaintingsPayload {
  paintings: AdminPainting[];
  total: number;
}
