import type { Project, ProjectMedia } from '@/interfaces/Portfolio';

/** Every image of the project, in the order the strip shows them. */
export function getProjectImages(project: Project): ProjectMedia[] {
  return project.images;
}

export function countProjectImages(project: Project): number {
  return project.images.length;
}

/** width / height of an image, with a safe fallback for entries without one. */
export function getProjectImageRatio(image: ProjectMedia): number {
  if (image.aspectRatio > 0) return image.aspectRatio;
  return image.width / Math.max(image.height, 1);
}
