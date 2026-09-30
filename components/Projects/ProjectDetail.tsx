'use client';

import type { Project } from '@/interfaces/Portfolio';

interface ProjectDetailProps {
  project: Project;
}

function formatProjectStatus(value: string) {
  if (value === "done") return "Done";
  if (value === "in-progress") return "In Progress";
  return value.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function ProjectDetail({ project }: ProjectDetailProps) {
  const metadata = Object.entries(project.dynamicFields);

  return (
    <section className="projects-detail" aria-labelledby="project-title">
      <h1 className="projects-detail__name" id="project-title">{project.name}</h1>

      <div className="projects-detail__info">
        <span>My Role: {project.myRole.join(' - ')}</span>
        {project.projectStatusId && (
          <>
            <br />
            <span>Project Status: {project.projectStatusName ?? formatProjectStatus(project.projectStatusId)}</span>
          </>
        )}

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
