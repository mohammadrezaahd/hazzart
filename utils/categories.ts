import type { PaintingCategory } from '@/interfaces/Portfolio';

function collectIds(category: PaintingCategory): string[] {
  return [category.id, ...(category.children ?? []).flatMap(collectIds)];
}

export function getCategoryAndDescendantIds(categories: PaintingCategory[], categoryId: string): string[] {
  for (const category of categories) {
    if (category.id === categoryId) return collectIds(category);
    const nested = getCategoryAndDescendantIds(category.children ?? [], categoryId);
    if (nested.length) return nested;
  }
  return [];
}

export function getExpandedCategoryId(categories: PaintingCategory[], categoryId: string | null): string | null {
  if (!categoryId) return null;
  return categories.find(category => category.id === categoryId || collectIds(category).includes(categoryId))?.id ?? null;
}
