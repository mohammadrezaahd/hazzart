'use client';

import Image from 'next/image';
import { useEffect, useRef, type CSSProperties } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import type { Artwork } from '@/interfaces/Portfolio';

interface ArtworkSliderProps {
  items: Artwork[];
  ariaLabel?: string;
}

function getDisplayedRatio(artwork: Artwork) {
  return artwork.table.aspectRatio;
}

export function ArtworkSlider({ items, ariaLabel = 'Paintings' }: ArtworkSliderProps) {
  const scroller = useRef<HTMLDivElement>(null);
  const targetScroll = useRef(0);

  useGSAP(() => {
    const element = scroller.current;
    if (!element) return;
    element.scrollLeft = 0;
    targetScroll.current = 0;
    const slides = element.querySelectorAll<HTMLElement>('.artwork-slider__slide');
    gsap.fromTo(slides, { autoAlpha: 0, x: 42 }, {
      autoAlpha: 1,
      x: 0,
      duration: 0.72,
      stagger: 0.075,
      ease: 'power3.out',
      clearProps: 'transform,visibility',
    });
  }, { scope: scroller, dependencies: [items], revertOnUpdate: true });

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;

    const stopTween = () => {
      gsap.killTweensOf(element);
      targetScroll.current = element.scrollLeft;
    };
    const onWheel = (event: WheelEvent) => {
      const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      const maximum = element.scrollWidth - element.clientWidth;
      if (!delta || maximum <= 0) return;
      const next = Math.max(0, Math.min(maximum, targetScroll.current + delta));
      if (next === targetScroll.current) return;
      event.preventDefault();
      targetScroll.current = next;
      gsap.to(element, {
        scrollLeft: next,
        duration: 0.62,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    };
    const syncNativeScroll = () => {
      if (!gsap.isTweening(element)) targetScroll.current = element.scrollLeft;
    };

    element.addEventListener('wheel', onWheel, { passive: false });
    element.addEventListener('pointerdown', stopTween, { passive: true });
    element.addEventListener('scroll', syncNativeScroll, { passive: true });
    return () => {
      gsap.killTweensOf(element);
      element.removeEventListener('wheel', onWheel);
      element.removeEventListener('pointerdown', stopTween);
      element.removeEventListener('scroll', syncNativeScroll);
    };
  }, [items]);

  return (
    <div className="artwork-slider" ref={scroller} aria-label={ariaLabel} tabIndex={0}>
      <div className="artwork-slider__track">
        {items.map((artwork, index) => {
          const ratio = getDisplayedRatio(artwork);
          return (
            <figure
              className="artwork-slider__slide"
              key={artwork.id}
              style={{ '--slide-ratio': ratio } as CSSProperties}
            >
              <span className={`artwork-slider__image ${artwork.image.rotate ? 'artwork-slider__image--rotated' : ''}`} style={{ transform: artwork.image.flipX ? 'scaleX(-1)' : undefined }}>
                <Image
                  src={artwork.image.src}
                  alt={artwork.image.alt}
                  fill
                  sizes="(max-width: 767px) 78vw, 46vw"
                  priority={index < 4}
                  draggable={false}
                />
              </span>
              <figcaption className="sr-only">{artwork.title}, {artwork.year}</figcaption>
            </figure>
          );
        })}
      </div>
      {items.length === 0 && <p className="paintings-empty">No paintings in this category yet.</p>}
    </div>
  );
}
