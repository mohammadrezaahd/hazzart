'use client';

import type { Project } from '@/interfaces/Portfolio';

interface ProjectDetailProps {
  project: Project;
  index: number;
  total: number;
}

/**
 * The data of the project that is currently on screen. It sits above the slider, which
 * is why the slider itself only shows the work.
 */
export function ProjectDetail({ project, index, total }: ProjectDetailProps) {
  const metadata = Object.entries(project.dynamicFields);

  return (
    <section className="projects-detail" aria-label={`${project.name} details`}>
      <div className="projects-detail__lead">
        <p className="projects-detail__eyebrow">
          <span>{String(index + 1).padStart(2, '0')}</span>
          <span aria-hidden="true">/</span>
          <span>{String(total).padStart(2, '0')}</span>
          <span aria-hidden="true">·</span>
          <span>{project.discipline}</span>
        </p>
        <h2 className="projects-detail__title">{project.name}</h2>
        <p className="projects-detail__tagline">{project.tagline}</p>
        <p className="projects-detail__description">{project.description}</p>
      </div>

      <div className="projects-detail__aside">
        <dl className="projects-detail__meta">
          <div>
            <dt>Year</dt>
            <dd>{project.year}</dd>
          </div>
          <div>
            <dt>Client</dt>
            <dd>{project.client}</dd>
          </div>
          <div>
            <dt>My role</dt>
            <dd>{project.myRole.join(', ')}</dd>
          </div>
          {metadata.map(([key, value]) => (
            <div key={`${project.id}-${key}`}>
              <dt>{key}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        {project.links.length > 0 && (
          <nav className="projects-detail__links" aria-label={`${project.name} links`}>
            {project.links.map(link => (
              <a key={link.id} href={link.href} target="_blank" rel="noreferrer">
                {link.label}
                <span aria-hidden="true">↗</span>
              </a>
            ))}
          </nav>
        )}
      </div>
    </section>
  );
}
