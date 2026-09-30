import type { Project, ProjectMedia } from '@/interfaces/Portfolio';

/** Every image of the project, in the order the strip shows them. */
export function getProjectImages(project: Project): ProjectMedia[] {
  return project.images;
}

export function countProjectImages(project: Project): number {
  return project.images.length;
}

/** The slide width is always derived from the actual media dimensions. */
export function getProjectImageRatio(image: ProjectMedia): number {
  if (image.width > 0 && image.height > 0) {
    return image.width / image.height;
  }

  return image.aspectRatio > 0 ? image.aspectRatio : 1;
}
