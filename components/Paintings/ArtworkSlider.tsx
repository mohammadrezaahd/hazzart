'use client';

import Image from 'next/image';
import { ReusableSlider } from '@/components/Slider';
import type { Artwork } from '@/interfaces/Portfolio';

interface ArtworkSliderProps {
  items: Artwork[];
  ariaLabel?: string;
  infinite?: boolean;
}

function getDisplayedRatio(artwork: Artwork) {
  return artwork.table.aspectRatio;
}

/** Paintings gallery: an endless strip of works that can be dragged, scrolled or scrubbed. */
export function ArtworkSlider({ items, ariaLabel = 'Paintings', infinite = true }: ArtworkSliderProps) {
  return (
    <ReusableSlider
      items={items}
      ariaLabel={ariaLabel}
      className="artwork-slider"
      slideClassName="artwork-slider__slide"
      infinite={infinite}
      emptyMessage="No paintings in this category yet."
      getItemId={artwork => artwork.id}
      getSlideAspectRatio={getDisplayedRatio}
      getSlideA11yLabel={artwork => `${artwork.title}, ${artwork.year}`}
      renderSlide={(artwork, index) => (
        <span
          className={`artwork-slider__image ${artwork.image.rotate ? 'artwork-slider__image--rotated' : ''}`}
          style={{ transform: artwork.image.flipX ? 'scaleX(-1)' : undefined }}
        >
          <Image
            className="artwork-slider__image-primary"
            src={artwork.image.src}
            alt={artwork.image.alt}
            fill
            sizes="(max-width: 767px) 78vw, 46vw"
            priority={index < 4}
            draggable={false}
          />
          <Image
            className="artwork-slider__image-hover"
            src={artwork.hoverImage.src}
            alt=""
            fill
            sizes="(max-width: 767px) 78vw, 46vw"
            priority={index < 4}
            draggable={false}
            aria-hidden="true"
          />
        </span>
      )}
    />
  );
}
