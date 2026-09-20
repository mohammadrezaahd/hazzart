'use client';

import type { Project } from '@/interfaces/Portfolio';

interface ProjectDetailProps {
  project: Project;
}

export function ProjectDetail({ project }: ProjectDetailProps) {
  const metadata = Object.entries(project.dynamicFields);

  return (
    <section className="projects-detail" aria-labelledby="project-title">
      <h1 className="projects-detail__name" id="project-title">{project.name}</h1>

      <div className="projects-detail__info">
        <span>My Role: {project.myRole.join(' - ')}</span>

        <br /><br />

        {metadata.map(([key, value]) => (
          <span key={key}>
            {key}: {value}
            <br />
          </span>
        ))}

        {project.links.length > 0 && (
          <>
            <br />
            {project.links.map(link => (
              <a
                key={link.id}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="projects-detail__link"
              >
                {link.label}
              </a>
            ))}
          </>
        )}
      </div>
    </section>
  );
}
