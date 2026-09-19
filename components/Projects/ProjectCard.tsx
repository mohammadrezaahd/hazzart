'use client';

import Image from 'next/image';
import { useId, useState } from 'react';
import type { Project } from '@/interfaces/Portfolio';
import { getProjectMedia } from '@/utils/projects';

interface ProjectCardProps {
  project: Project;
  index: number;
  eager?: boolean;
}

/**
 * One project slide: the visual stage on the left, the written information on the
 * right. The stage cycles through the project assets; the rail under it stays quiet
 * so the artwork keeps the attention.
 */
export function ProjectCard({ project, index, eager = false }: ProjectCardProps) {
  const media = getProjectMedia(project);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const stageId = useId();
  const activeMedia = media[activeMediaIndex] ?? project.cover;
  const metadata = Object.entries(project.dynamicFields);

  return (
    <article className="project-card" aria-labelledby={`${stageId}-title`}>
      <div className="project-card__media">
        <div className="project-card__stage">
          {media.map((item, mediaIndex) => (
            <Image
              className="project-card__image"
              key={`${project.id}-${item.src}-${mediaIndex}`}
              src={item.src}
              alt={item.alt}
              fill
              sizes="(max-width: 899px) 92vw, 45vw"
              priority={eager && mediaIndex === 0}
              draggable={false}
              data-active={mediaIndex === activeMediaIndex}
              style={{ objectPosition: item.focalPoint ?? 'center' }}
            />
          ))}
        </div>

        <div className="project-card__media-footer">
          <p className="project-card__caption" aria-live="polite">{activeMedia.caption ?? activeMedia.alt}</p>
          {media.length > 1 && (
            <ul className="project-card__thumbs" aria-label={`${project.name} images`}>
              {media.map((item, mediaIndex) => (
                <li key={`thumb-${project.id}-${mediaIndex}`}>
                  <button
                    type="button"
                    className="project-card__thumb"
                    aria-pressed={mediaIndex === activeMediaIndex}
                    aria-label={`Show image ${mediaIndex + 1} of ${media.length}`}
                    onClick={() => setActiveMediaIndex(mediaIndex)}
                  >
                    <Image src={item.src} alt="" width={64} height={64} draggable={false} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="project-card__content">
        <p className="project-card__eyebrow">
          <span>{project.discipline}</span>
          <span aria-hidden="true">·</span>
          <span>{project.year}</span>
        </p>
        <h2 className="project-card__title" id={`${stageId}-title`}>{project.name}</h2>
        <p className="project-card__tagline">{project.tagline}</p>
        <p className="project-card__description">{project.description}</p>

        <div className="project-card__roles">
          <h3 className="project-card__label">My role</h3>
          <ul>
            {project.myRole.map(role => <li key={`${project.id}-${role}`}>{role}</li>)}
          </ul>
        </div>

        <dl className="project-card__metadata">
          <div>
            <dt>Client</dt>
            <dd>{project.client}</dd>
          </div>
          {metadata.map(([key, value]) => (
            <div key={`${project.id}-${key}`}>
              <dt>{key}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        {project.links.length > 0 && (
          <nav className="project-card__links" aria-label={`${project.name} links`}>
            {project.links.map(link => (
              <a key={link.id} href={link.href} target="_blank" rel="noreferrer">
                {link.label}
                <span aria-hidden="true">↗</span>
              </a>
            ))}
          </nav>
        )}

        <p className="project-card__index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</p>
      </div>
    </article>
  );
}
