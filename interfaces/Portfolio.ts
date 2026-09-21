export interface Artwork {
  id: string;
  title: string;
  year: number;
  createdAt: string;
  description: string;
  mediumId: string;
  paintingCategoryIds: string[];
  image: {
    src: string;
    alt: string;
    width: number;
    height: number;
    flipX?: boolean;
    rotate?: number;
  };
  dimensions: string;
  table: { rotation: number; aspectRatio: number };
}
export interface Medium {
  id: string;
  label: string;
}
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
  /** width / height — drives the slide width, exactly like the paintings slider. */
  aspectRatio: number;
  /** Optional CSS object-position, used when a cover needs a specific crop. */
  focalPoint?: string;
  caption?: string;
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
  description: string;
  year: number;
  discipline: string;
  client: string;
  myRole: string[];
  /** Every image of the project, in the order the strip shows them. */
  images: ProjectMedia[];
  links: ProjectLink[];
  dynamicFields: ProjectDynamicFields;
}
export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
}
export type TableOrder = "random" | "recent" | "yearly";
export interface FooterItem {
  id: TableOrder | "medium";
  label: string;
}
export interface PortfolioData {
  artist: { name: string; description: string };
  artworks: Artwork[];
  /** The site shows one project at a time — the projects page is that project. */
  project: Project;
  mediums: Medium[];
  paintingCategories: PaintingCategory[];
}
