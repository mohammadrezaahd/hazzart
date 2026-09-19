'use client';

import type { Project } from '@/interfaces/Portfolio';

interface ProjectDetailProps {
  project: Project;
}

/**
 * The written side of the project. The page tells one project's story, so this block
 * stays still while the strip below walks through the project's images.
 */
export function ProjectDetail({ project }: ProjectDetailProps) {
  const metadata = Object.entries(project.dynamicFields);

  return (
    <section className="projects-detail" aria-labelledby="project-title">
      <div className="projects-detail__lead">
        <p className="projects-detail__eyebrow">
          <span>{project.discipline}</span>
          <span aria-hidden="true">·</span>
          <span>{project.year}</span>
        </p>
        <h1 className="projects-detail__title" id="project-title">{project.name}</h1>
      </div>

      <div className="projects-detail__body">
        <p className="projects-detail__tagline">{project.tagline}</p>
        <p className="projects-detail__description">{project.description}</p>

        <dl className="projects-detail__meta">
          <div>
            <dt>Client</dt>
            <dd>{project.client}</dd>
          </div>
          <div>
            <dt>My role</dt>
            <dd>{project.myRole.join(', ')}</dd>
          </div>
          {metadata.map(([key, value]) => (
            <div key={key}>
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
