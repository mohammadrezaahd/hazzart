export interface Artwork {
  id: string;
  title: string;
  year: number;
  createdAt: string;
  description: string;
  mediumId: string;
  paintingCategoryIds: string[];
  image: { src: string; alt: string; width: number; height: number; flipX?: boolean; rotate?: number };
  dimensions: string;
  table: { rotation: number; aspectRatio: number };
}
export interface Medium { id: string; label: string }
export interface PaintingCategory {
  id: string;
  label: string;
  children?: PaintingCategory[];
}
export interface NavigationItem { id: string; label: string; href: string; icon?: string }
export type TableOrder = 'random' | 'recent' | 'yearly';
export interface FooterItem { id: TableOrder | 'medium'; label: string }
export interface PortfolioData {
  artist: { name: string; description: string };
  artworks: Artwork[];
  mediums: Medium[];
  paintingCategories: PaintingCategory[];
}
