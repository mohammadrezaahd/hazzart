'use client';

import Image from 'next/image';
import { fakeData } from '@/consts/fakeData';
import { ReusableSlider } from '@/components/Paintings/ArtworkSlider';

export function ProjectsExperience() {
  return (
    <main className="projects-experience" id="main-content">
      <ReusableSlider
        items={fakeData.projects}
        ariaLabel="Projects"
        className="projects-slider"
        infinite={false}
        pagination={{ enabled: true, ariaLabel: 'Project pagination' }}
        edgeOverflow={{ enabled: true, wrap: true, chargeWheelDistance: 720 }}
        emptyMessage="No projects added yet."
        getItemId={project => project.id}
        getSlideAspectRatio={project => project.cover.aspectRatio}
        getSlideA11yLabel={project => project.name}
        renderSlide={(project, index) => (
          <article className="project-card">
            <div className="project-card__media">
              <Image
                src={project.cover.src}
                alt={project.cover.alt}
                fill
                sizes="(max-width: 767px) 88vw, 56vw"
                priority={index < 2}
                draggable={false}
              />
            </div>
            <div className="project-card__content">
              <p className="project-card__eyebrow">Project {index + 1}</p>
              <h2>{project.name}</h2>
              <p className="project-card__tagline">{project.tagline}</p>
              <div className="project-card__roles">
                <span>My role</span>
                <ul>
                  {project.myRole.map(role => <li key={`${project.id}-${role}`}>{role}</li>)}
                </ul>
              </div>
              <dl className="project-card__metadata">
                {Object.entries(project.dynamicFields).map(([key, value]) => (
                  <div key={`${project.id}-${key}`}>
                    <dt>{key}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              {project.links.length > 0 && (
                <nav className="project-card__links" aria-label={`${project.name} links`}>
                  {project.links.map(link => (
                    <a key={link.id} href={link.href} target="_blank" rel="noreferrer">{link.label}</a>
                  ))}
                </nav>
              )}
            </div>
          </article>
        )}
      />
      <span className="sr-only" role="status">{fakeData.projects.length} projects shown</span>
    </main>
  );
}
