'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { ReusableSlider } from '@/components/Slider';
import type { Artwork } from '@/interfaces/Portfolio';

interface ArtworkSliderProps {
  items: Artwork[];
  ariaLabel?: string;
  infinite?: boolean;
}

export function ArtworkSlider({ items, ariaLabel = 'Paintings', infinite = true }: ArtworkSliderProps) {
  const [ratios, setRatios] = useState<Record<string, number>>({});
  const [alternateArtworkId, setAlternateArtworkId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loaders = items.map((artwork) => {
      const loader = new window.Image();
      loader.src = artwork.image.src;
      return new Promise<[string, number] | null>((resolve) => {
        loader.onload = () => {
          if (loader.naturalWidth > 0 && loader.naturalHeight > 0) {
            const rotated = Math.abs(artwork.image.rotate ?? 0) % 180 === 90;
            resolve([artwork.id, rotated ? loader.naturalHeight / loader.naturalWidth : loader.naturalWidth / loader.naturalHeight]);
          } else {
            resolve(null);
          }
        };
        loader.onerror = () => resolve(null);
      });
    });

    void Promise.all(loaders).then((loaded) => {
      if (!active) return;
      setRatios((current) => {
        const next = { ...current };
        loaded.forEach((entry) => {
          if (entry) next[entry[0]] = entry[1];
        });
        return next;
      });
    });

    return () => {
      active = false;
    };
  }, [items]);

  const getRatio = useMemo(
    () => (artwork: Artwork) => ratios[artwork.id] ?? artwork.table.aspectRatio,
    [ratios],
  );

  return (
    <ReusableSlider
      items={items}
      ariaLabel={ariaLabel}
      className="artwork-slider"
      slideClassName="artwork-slider__slide"
      infinite={infinite}
      emptyMessage="No paintings in this category yet."
      getItemId={artwork => artwork.id}
      getSlideAspectRatio={getRatio}
      getSlideA11yLabel={artwork => `${artwork.title}, ${artwork.year}`}
      renderSlide={(artwork, index) => {
        const showAlternate = alternateArtworkId === artwork.id;
        const toggleAlternate = () => setAlternateArtworkId(current => current === artwork.id ? null : artwork.id);
        return (
          <span
            className="artwork-slider__image"
            role="button"
            tabIndex={0}
            aria-label={`Show alternate image for ${artwork.title}`}
            aria-pressed={showAlternate}
            onClick={() => {
              if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) toggleAlternate();
            }}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleAlternate();
              }
            }}
            style={{
              transform: artwork.image.flipX ? 'scaleX(-1)' : undefined,
              pointerEvents: 'auto',
            }}
          >
            <Image
              className={`artwork-slider__primary-image ${Math.abs(artwork.image.rotate ?? 0) % 180 === 90 ? 'artwork-slider__image--rotated' : ''}`}
              src={artwork.image.src}
              alt={artwork.image.alt}
              fill
              sizes="(max-width: 767px) 78vw, 46vw"
              priority={index < 4}
              draggable={false}
              style={showAlternate ? { opacity: 0 } : undefined}
            />
            <Image
              className={`artwork-slider__hover-image ${Math.abs(artwork.hoverImage.rotate ?? 0) % 180 === 90 ? 'artwork-slider__image--rotated' : ''}`}
              src={artwork.hoverImage.src}
              alt={artwork.hoverImage.alt}
              fill
              sizes="(max-width: 767px) 78vw, 46vw"
              priority={index < 4}
              draggable={false}
              aria-hidden
              style={showAlternate ? { opacity: 1 } : undefined}
            />
          </span>
        );
      }}
    />
  );
}
