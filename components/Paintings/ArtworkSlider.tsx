'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import type { Artwork } from '@/interfaces/Portfolio';

type SliderDirection = 'previous' | 'next';

interface ReusableSliderItem {
  id: string;
}

interface SliderEdgeOverflowConfig {
  enabled?: boolean;
  wrap?: boolean;
  chargeWheelDistance?: number;
  onCommit?: (payload: { direction: SliderDirection; currentIndex: number; nextIndex: number }) => void;
}

interface ReusableSliderProps<TItem extends ReusableSliderItem> {
  items: TItem[];
  ariaLabel?: string;
  className?: string;
  infinite?: boolean;
  emptyMessage?: string;
  pagination?: { enabled?: boolean; ariaLabel?: string };
  edgeOverflow?: SliderEdgeOverflowConfig;
  getItemId: (item: TItem) => string;
  getSlideAspectRatio: (item: TItem) => number;
  getSlideA11yLabel?: (item: TItem, index: number) => string;
  renderSlide: (item: TItem, index: number) => ReactNode;
}

interface EdgeState {
  direction: SliderDirection;
  progress: number;
  armed: boolean;
  popping: boolean;
}

interface ArtworkSliderProps {
  items: Artwork[];
  ariaLabel?: string;
  infinite?: boolean;
}

function getDisplayedRatio(artwork: Artwork) {
  return artwork.table.aspectRatio;
}

const EDGE_EPSILON = 0.5;

export function ReusableSlider<TItem extends ReusableSliderItem>({
  items,
  ariaLabel,
  className,
  infinite = false,
  emptyMessage = 'No items to display yet.',
  pagination,
  edgeOverflow,
  getItemId,
  getSlideAspectRatio,
  getSlideA11yLabel,
  renderSlide,
}: ReusableSliderProps<TItem>) {
  const scroller = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const targetScroll = useRef(0);
  const loopWidth = useRef(0);
  const delayedNavigation = useRef<gsap.core.Tween | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [edgeState, setEdgeState] = useState<EdgeState | null>(null);

  const hasInfiniteLoop = infinite && items.length > 1;
  const canOverflowNavigate = !hasInfiniteLoop && !!edgeOverflow?.enabled && items.length > 1;
  const renderedSlides = useMemo(() => {
    if (!hasInfiniteLoop) {
      return items.map((item, baseIndex) => ({ item, baseIndex, loopIndex: 0, key: `${getItemId(item)}-${baseIndex}` }));
    }
    return [0, 1, 2].flatMap(loopIndex => items.map((item, baseIndex) => ({
      item,
      baseIndex,
      loopIndex,
      key: `${loopIndex}-${getItemId(item)}-${baseIndex}`,
    })));
  }, [getItemId, hasInfiniteLoop, items]);

  const clearEdgeState = useCallback(() => {
    setEdgeState(null);
    delayedNavigation.current?.kill();
    delayedNavigation.current = null;
  }, []);

  const normalizeInfiniteScroll = useCallback((element: HTMLDivElement) => {
    if (!hasInfiniteLoop || loopWidth.current <= 0) return element.scrollLeft;
    const current = element.scrollLeft;
    let normalized = current;
    if (current < loopWidth.current * 0.5) normalized = current + loopWidth.current;
    else if (current > loopWidth.current * 1.5) normalized = current - loopWidth.current;
    if (normalized !== current) element.scrollLeft = normalized;
    return normalized;
  }, [hasInfiniteLoop]);

  const updateActiveIndex = useCallback((element: HTMLDivElement) => {
    if (items.length === 0) return;
    const selector = hasInfiniteLoop
      ? '.reusable-slider__slide[data-loop-index="1"]'
      : '.reusable-slider__slide';
    const slides = Array.from(element.querySelectorAll<HTMLElement>(selector));
    if (slides.length === 0) return;
    const viewportCenter = element.scrollLeft + element.clientWidth * 0.5;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    for (const slide of slides) {
      const center = slide.offsetLeft + slide.offsetWidth * 0.5;
      const distance = Math.abs(center - viewportCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = Number(slide.dataset.baseIndex ?? '0');
      }
    }
    setActiveIndex(previous => previous === closestIndex ? previous : closestIndex);
  }, [hasInfiniteLoop, items.length]);

  const scrollToIndex = useCallback((index: number) => {
    const element = scroller.current;
    if (!element) return;
    const safeIndex = Math.max(0, Math.min(items.length - 1, index));
    const loopSelector = hasInfiniteLoop ? '[data-loop-index="1"]' : '[data-loop-index="0"]';
    const slide = element.querySelector<HTMLElement>(`.reusable-slider__slide[data-base-index="${safeIndex}"]${loopSelector}`);
    if (!slide) return;
    const destination = slide.offsetLeft;
    targetScroll.current = destination;
    gsap.to(element, {
      scrollLeft: destination,
      duration: 0.55,
      ease: 'power3.out',
      overwrite: 'auto',
      onUpdate: () => {
        targetScroll.current = normalizeInfiniteScroll(element);
      },
      onComplete: () => {
        targetScroll.current = normalizeInfiniteScroll(element);
        updateActiveIndex(element);
      },
    });
  }, [hasInfiniteLoop, items.length, normalizeInfiniteScroll, updateActiveIndex]);

  const completeOverflowNavigation = useCallback((direction: SliderDirection) => {
    const currentIndex = activeIndex;
    const isFirst = currentIndex <= 0;
    const isLast = currentIndex >= items.length - 1;
    let nextIndex = currentIndex;
    if (direction === 'next' && isLast) {
      nextIndex = edgeOverflow?.wrap === false ? currentIndex : 0;
    } else if (direction === 'previous' && isFirst) {
      nextIndex = edgeOverflow?.wrap === false ? currentIndex : items.length - 1;
    }

    edgeOverflow?.onCommit?.({ direction, currentIndex, nextIndex });
    scrollToIndex(nextIndex);
    setActiveIndex(nextIndex);
    clearEdgeState();
  }, [activeIndex, clearEdgeState, edgeOverflow, items.length, scrollToIndex]);

  const triggerOverflowNavigation = useCallback((direction: SliderDirection) => {
    setEdgeState({ direction, progress: 1, armed: false, popping: true });
    delayedNavigation.current?.kill();
    delayedNavigation.current = gsap.to({}, {
      duration: 0.22,
      onComplete: () => completeOverflowNavigation(direction),
    });
  }, [completeOverflowNavigation]);

  const handleEdgeWheel = useCallback((direction: SliderDirection, wheelMagnitude: number) => {
    setEdgeState(previous => {
      if (!previous || previous.direction !== direction) {
        return { direction, progress: 0, armed: true, popping: false };
      }
      if (previous.popping) return previous;

      const chargingDistance = edgeOverflow?.chargeWheelDistance ?? 650;
      const progressIncrement = wheelMagnitude / chargingDistance;
      const progress = Math.max(0, Math.min(1, previous.progress + progressIncrement));
      if (progress >= 1) {
        triggerOverflowNavigation(direction);
        return { direction, progress: 1, armed: false, popping: true };
      }
      return { direction, progress, armed: false, popping: false };
    });
  }, [edgeOverflow?.chargeWheelDistance, triggerOverflowNavigation]);

  useGSAP(() => {
    const element = scroller.current;
    if (!element) return;
    if (hasInfiniteLoop && track.current) {
      loopWidth.current = track.current.scrollWidth / 3;
      element.scrollLeft = loopWidth.current;
      targetScroll.current = loopWidth.current;
    } else {
      loopWidth.current = 0;
      element.scrollLeft = 0;
      targetScroll.current = 0;
    }

    updateActiveIndex(element);
    const slides = element.querySelectorAll<HTMLElement>('.reusable-slider__slide');
    gsap.fromTo(slides, { autoAlpha: 0, x: 42 }, {
      autoAlpha: 1,
      x: 0,
      duration: 0.72,
      stagger: 0.075,
      ease: 'power3.out',
      clearProps: 'transform,visibility',
    });
  }, { scope: scroller, dependencies: [hasInfiniteLoop, items], revertOnUpdate: true });

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;

    clearEdgeState();
    const stopTween = () => {
      gsap.killTweensOf(element);
      targetScroll.current = element.scrollLeft;
    };

    const onWheel = (event: WheelEvent) => {
      const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (!delta) return;

      if (hasInfiniteLoop) {
        event.preventDefault();
        targetScroll.current += delta;
      } else {
        const maximum = Math.max(0, element.scrollWidth - element.clientWidth);
        if (maximum <= 0) return;
        const next = Math.max(0, Math.min(maximum, targetScroll.current + delta));
        if (next === targetScroll.current) {
          const direction: SliderDirection = delta > 0 ? 'next' : 'previous';
          const atEdge = direction === 'next'
            ? targetScroll.current >= maximum - EDGE_EPSILON
            : targetScroll.current <= EDGE_EPSILON;
          if (canOverflowNavigate && atEdge) {
            event.preventDefault();
            handleEdgeWheel(direction, Math.abs(delta));
          }
          return;
        }
        clearEdgeState();
        event.preventDefault();
        targetScroll.current = next;
      }

      gsap.to(element, {
        scrollLeft: targetScroll.current,
        duration: 0.62,
        ease: 'power3.out',
        overwrite: 'auto',
        onUpdate: () => {
          targetScroll.current = normalizeInfiniteScroll(element);
          updateActiveIndex(element);
        },
        onComplete: () => {
          targetScroll.current = normalizeInfiniteScroll(element);
          updateActiveIndex(element);
        },
      });
    };

    const syncNativeScroll = () => {
      if (gsap.isTweening(element)) return;
      targetScroll.current = normalizeInfiniteScroll(element);
      updateActiveIndex(element);
    };

    element.addEventListener('wheel', onWheel, { passive: false });
    element.addEventListener('pointerdown', stopTween, { passive: true });
    element.addEventListener('scroll', syncNativeScroll, { passive: true });
    return () => {
      gsap.killTweensOf(element);
      element.removeEventListener('wheel', onWheel);
      element.removeEventListener('pointerdown', stopTween);
      element.removeEventListener('scroll', syncNativeScroll);
      delayedNavigation.current?.kill();
      delayedNavigation.current = null;
    };
  }, [
    canOverflowNavigate,
    clearEdgeState,
    edgeOverflow?.chargeWheelDistance,
    handleEdgeWheel,
    hasInfiniteLoop,
    items,
    normalizeInfiniteScroll,
    updateActiveIndex,
  ]);

  useEffect(() => {
    if (activeIndex >= items.length) setActiveIndex(Math.max(0, items.length - 1));
  }, [activeIndex, items.length]);

  return (
    <div className={`reusable-slider ${className ?? ''}`}>
      <div className="reusable-slider__viewport" ref={scroller} aria-label={ariaLabel} tabIndex={0}>
        <div className="reusable-slider__track" ref={track}>
          {renderedSlides.map(({ item, baseIndex, loopIndex, key }) => {
            const ratio = getSlideAspectRatio(item);
            const label = getSlideA11yLabel?.(item, baseIndex);
            return (
              <figure
                className="reusable-slider__slide artwork-slider__slide"
                key={key}
                style={{ '--slide-ratio': ratio } as CSSProperties}
                data-base-index={baseIndex}
                data-loop-index={loopIndex}
              >
                {renderSlide(item, baseIndex)}
                {label && <figcaption className="sr-only">{label}</figcaption>}
              </figure>
            );
          })}
        </div>
        {canOverflowNavigate && edgeState && (
          <button
            type="button"
            className={`reusable-slider__edge-cta reusable-slider__edge-cta--${edgeState.direction} ${edgeState.popping ? 'reusable-slider__edge-cta--popping' : ''}`}
            style={{ '--edge-progress': edgeState.progress } as CSSProperties}
            aria-label={edgeState.direction === 'next' ? 'Go to next project' : 'Go to previous project'}
            onClick={() => triggerOverflowNavigation(edgeState.direction)}
          >
            <span className={`reusable-slider__edge-arrow reusable-slider__edge-arrow--${edgeState.direction}`} aria-hidden="true">{edgeState.direction === 'next' ? '→' : '←'}</span>
          </button>
        )}
      </div>
      {pagination?.enabled && items.length > 1 && (
        <div className="reusable-slider__pagination" role="tablist" aria-label={pagination.ariaLabel ?? 'Slider pagination'}>
          {items.map((item, index) => (
            <button
              key={`pagination-${getItemId(item)}`}
              type="button"
              className="reusable-slider__page"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Go to slide ${index + 1}`}
              data-active={index === activeIndex}
              onClick={() => {
                clearEdgeState();
                scrollToIndex(index);
              }}
            />
          ))}
        </div>
      )}
      {items.length === 0 && <p className="paintings-empty">{emptyMessage}</p>}
    </div>
  );
}

export function ArtworkSlider({ items, ariaLabel = 'Paintings', infinite = true }: ArtworkSliderProps) {
  return (
    <ReusableSlider
      items={items}
      ariaLabel={ariaLabel}
      className="artwork-slider"
      infinite={infinite}
      emptyMessage="No paintings in this category yet."
      getItemId={artwork => artwork.id}
      getSlideAspectRatio={getDisplayedRatio}
      getSlideA11yLabel={artwork => `${artwork.title}, ${artwork.year}`}
      renderSlide={(artwork, index) => (
        <>
          <span
            className={`artwork-slider__image ${artwork.image.rotate ? 'artwork-slider__image--rotated' : ''}`}
            style={{ transform: artwork.image.flipX ? 'scaleX(-1)' : undefined }}
          >
            <Image
              src={artwork.image.src}
              alt={artwork.image.alt}
              fill
              sizes="(max-width: 767px) 78vw, 46vw"
              priority={index < 4}
              draggable={false}
            />
          </span>
        </>
      )}
    />
  );
}
