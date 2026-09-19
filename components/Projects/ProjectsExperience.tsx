'use client';

import { fakeData } from '@/consts/fakeData';
import { ReusableSlider } from '@/components/Slider';
import { ProjectCard } from './ProjectCard';

/**
 * Projects page.
 *
 * The slider is bounded: it loops only in the sense that it never wraps, it settles on
 * the nearest project and, when the visitor keeps pushing past an end, the space around
 * the track opens up and the matching arrow appears in it. The control under the slider
 * is the same slider seen from above — one page per project plus a thumb that mirrors
 * how much of the track is on screen.
 */
export function ProjectsExperience() {
  const { projects } = fakeData;

  return (
    <main className="projects-experience" id="main-content">
      <h1 className="sr-only">Projects</h1>
      <p className="projects-intro">
        <span>Selected projects</span>
        <span className="projects-intro__count" aria-hidden="true">{String(projects.length).padStart(2, '0')}</span>
      </p>
      <ReusableSlider
        items={projects}
        ariaLabel="Projects"
        className="projects-slider"
        infinite={false}
        pagination={{ enabled: true, ariaLabel: 'Project pagination', getLabel: project => project.name }}
        edgeOverflow={{ enabled: true, chargeWheelDistance: 720, releaseDelay: 1400 }}
        emptyMessage="No projects added yet."
        getItemId={project => project.id}
        getSlideAspectRatio={project => project.cover.aspectRatio}
        getSlideA11yLabel={project => `${project.name}, ${project.year}`}
        renderSlide={(project, index) => <ProjectCard project={project} index={index} eager={index < 2} />}
      />
      <span className="sr-only" role="status">{projects.length} projects shown</span>
    </main>
  );
}
