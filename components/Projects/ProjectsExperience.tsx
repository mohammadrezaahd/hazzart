'use client';

import Image from 'next/image';
import { useCallback, useRef, useState } from 'react';
import { fakeData } from '@/consts/fakeData';
import { ReusableSlider } from '@/components/Slider';
import { ProjectDetail } from './ProjectDetail';
import { ProjectsDiagnostics } from './ProjectsDiagnostics';

/**
 * Projects page.
 *
 * One project on screen at a time: its data sits above the slider, the work itself is
 * the only thing inside the track, and the range control under it walks through the
 * projects. The slider is bounded — it never loops, it settles on a project, and one
 * wheel gesture moves exactly one project. When the visitor keeps pushing past either
 * end, the space around the track opens up and the matching arrow appears in it.
 */
export function ProjectsExperience() {
  const { projects } = fakeData;
  const [activeIndex, setActiveIndex] = useState(0);
  const wheelRoot = useRef<HTMLElement | null>(null);
  const activeProject = projects[activeIndex] ?? projects[0];

  const handleActiveIndex = useCallback((index: number) => setActiveIndex(index), []);

  return (
    <main className="projects-experience" id="main-content" ref={wheelRoot}>
      <h1 className="sr-only">Projects</h1>

      {activeProject && (
        <ProjectDetail
          key={activeProject.id}
          project={activeProject}
          index={activeIndex}
          total={projects.length}
        />
      )}

      <ReusableSlider
        items={projects}
        ariaLabel="Projects"
        className="projects-slider"
        infinite={false}
        wheelStep="page"
        wheelRoot={wheelRoot}
        pagination={{ enabled: true, ariaLabel: 'Project pagination', getLabel: project => project.name }}
        edgeOverflow={{ enabled: true, chargeWheelDistance: 260, releaseDelay: 1600 }}
        emptyMessage="No projects added yet."
        getItemId={project => project.id}
        getSlideAspectRatio={project => project.cover.aspectRatio}
        getSlideA11yLabel={project => `${project.name}, ${project.year}`}
        onActiveIndexChange={handleActiveIndex}
        renderSlide={(project, index) => (
          <span className="projects-piece">
            <span className="projects-piece__image">
              <Image
                src={project.cover.src}
                alt={project.cover.alt}
                fill
                sizes="(max-width: 899px) 96vw, 60vw"
                priority={index < 2}
                draggable={false}
              />
            </span>
          </span>
        )}
      />

      <ProjectsDiagnostics />
    </main>
  );
}
