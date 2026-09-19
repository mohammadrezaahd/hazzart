import type { Project } from '@/interfaces/Portfolio';

/** Every distinct visual asset of a project, cover first. */
export function getProjectMedia(project: Project) {
  return [project.cover, ...project.gallery];
}

export function countProjectMedia(projects: Project[]): number {
  return projects.reduce((total, project) => total + 1 + project.gallery.length, 0);
}

export function getProjectMediaCount(project: Project): number {
  return 1 + project.gallery.length;
}
