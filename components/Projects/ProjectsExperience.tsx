'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { fakeData } from '@/consts/fakeData';
import { ReusableSlider } from '@/components/Slider';
import { getProjectImageRatio, getProjectImages } from '@/utils/projects';
import { ProjectDetail } from './ProjectDetail';

export function ProjectsExperience() {
  const { projects } = fakeData;
  const [projectIndex, setProjectIndex] = useState(0);
  const [boundaryDirection, setBoundaryDirection] = useState<'previous' | 'next' | null>(null);
  const wheelRoot = useRef<HTMLElement | null>(null);

  const project = projects[projectIndex] ?? projects[0];
  const images = project ? getProjectImages(project) : [];

  useEffect(() => {
    if (!boundaryDirection) return;
    const timer = window.setTimeout(() => setBoundaryDirection(null), 900);
    return () => window.clearTimeout(timer);
  }, [boundaryDirection]);

  if (!project) {
    return (
      <main className="projects-experience" id="main-content" ref={wheelRoot}>
        <p className="paintings-empty">No projects added yet.</p>
      </main>
    );
  }

  const handleEdgeCommit = ({ direction }: { direction: 'previous' | 'next' }) => {
    const nextIndex = direction === 'next' ? projectIndex + 1 : projectIndex - 1;

    if (nextIndex >= 0 && nextIndex < projects.length) {
      setBoundaryDirection(null);
      setProjectIndex(nextIndex);
      return;
    }

    setBoundaryDirection(direction);
  };

  return (
    <main
      className={
        'projects-experience' +
        (boundaryDirection ? ' projects-experience--boundary-' + boundaryDirection : '')
      }
      id="main-content"
      ref={wheelRoot}
    >
      <div key={project.id} className="projects-scene">
        <ProjectDetail project={project} />

        <ReusableSlider
          items={images}
          ariaLabel={project.name + ' images'}
          className={
            "projects-slider" +
            (projectIndex === 0 ? " projects-slider--no-previous" : "") +
            (projectIndex === projects.length - 1 ? " projects-slider--no-next" : "")
          }
          infinite={false}
          wheelRoot={wheelRoot}
          animateEntrance={false}
          allowEdgeWithoutOverflow
          emptyMessage="No images added yet."
          pagination={{
            enabled: true,
            ariaLabel: project.name + ' images',
            getLabel: (image, index) => image.caption ?? ('Image ' + (index + 1)),
          }}
          edgeOverflow={{
            enabled: !boundaryDirection,
            chargeWheelDistance: 300,
            releaseDelay: 1400,
            onCommit: handleEdgeCommit,
          }}
          getItemId={image => image.src}
          getSlideAspectRatio={getProjectImageRatio}
          getSlideA11yLabel={(image, index) => image.caption ?? ('Image ' + (index + 1))}
          renderSlide={(image, index) => (
            <span className="projects-piece">
              <span className="projects-piece__image">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 899px) 62vw, 36vw"
                  priority={index < 2}
                  draggable={false}
                />
              </span>
            </span>
          )}
        />
      </div>

      {boundaryDirection && (
        <p
          className={'projects-boundary-message projects-boundary-message--' + boundaryDirection}
          role="status"
          aria-live="polite"
        >
          {boundaryDirection === 'previous' ? 'No previous project' : 'No next project'}
        </p>
      )}
    </main>
  );
}
