'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { fakeData } from '@/consts/fakeData';
import { ReusableSlider } from '@/components/Slider';
import { getProjectImageRatio, getProjectImages } from '@/utils/projects';
import { ProjectDetail } from './ProjectDetail';
import { ProjectsDiagnostics } from './ProjectsDiagnostics';

/**
 * Projects page — one project, told in full.
 *
 * The copy sits at the top and never changes; the strip below is the project's own
 * images, stuck together exactly like the paintings slider, and the dot on the line
 * under it shows how far along the visitor is. The strip is bounded: pushing past either
 * end opens the space for the matching arrow instead of moving the track.
 */
export function ProjectsExperience() {
  const { project } = fakeData;
  const images = getProjectImages(project);
  const wheelRoot = useRef<HTMLElement | null>(null);

  return (
    <main className="projects-experience" id="main-content" ref={wheelRoot}>
      <ProjectDetail project={project} />

      <ReusableSlider
        items={images}
        ariaLabel={`${project.name} images`}
        className="projects-slider"
        infinite={false}
        wheelRoot={wheelRoot}
        emptyMessage="No images added yet."
        pagination={{
          enabled: true,
          ariaLabel: `${project.name} images`,
          getLabel: (image, index) => image.caption ?? `Image ${index + 1}`,
        }}
        edgeOverflow={{ enabled: true, chargeWheelDistance: 560, releaseDelay: 1400 }}
        getItemId={image => image.src}
        getSlideAspectRatio={getProjectImageRatio}
        getSlideA11yLabel={(image, index) => image.caption ?? `Image ${index + 1}`}
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

      {/* <ProjectsDiagnostics /> */}
    </main>
  );
}
