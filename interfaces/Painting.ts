export interface AdminPaintingImage {
  fileId: string;
  url: string;
  name: string;
  contentType: string;
  size: number;
}

export interface AdminPainting {
  id: string;
  name: string;
  description: string;
  completedDate: string;
  categoryIds: string[];
  images: [AdminPaintingImage, AdminPaintingImage];
  createdAt: string;
  updatedAt: string;
}

export interface AdminPaintingsPayload {
  paintings: AdminPainting[];
  total: number;
}
