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
export interface ProjectMedia {
  src: string;
  alt: string;
  width: number;
  height: number;
  aspectRatio: number;
}
export interface ProjectLink {
  id: string;
  label: string;
  href: string;
}
export type ProjectDynamicFields = Record<string, string>;
export interface Project {
  id: string;
  name: string;
  tagline: string;
  myRole: string[];
  cover: ProjectMedia;
  links: ProjectLink[];
  dynamicFields: ProjectDynamicFields;
}
export interface NavigationItem { id: string; label: string; href: string; icon?: string }
export type TableOrder = 'random' | 'recent' | 'yearly';
export interface FooterItem { id: TableOrder | 'medium'; label: string }
export interface PortfolioData {
  artist: { name: string; description: string };
  artworks: Artwork[];
  projects: Project[];
  mediums: Medium[];
  paintingCategories: PaintingCategory[];
}
