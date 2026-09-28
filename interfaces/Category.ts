export interface AdminCategory {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCategoryPayload {
  categories: AdminCategory[];
}
