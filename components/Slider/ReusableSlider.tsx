'use client';

import { useEffect, useMemo, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { gsap } from '@/lib/gsap';
import { prefersReducedMotion } from '@/utils/motion';
import { SliderPagination } from './SliderPagination';
import { useSliderScroll, type SliderDirection } from './useSliderScroll';

interface ReusableSliderItem {
  id: string;
}

export interface SliderEdgeOverflowConfig {
  enabled?: boolean;
  /** Wheel distance (px) that fills the ring completely. */
  chargeWheelDistance?: number;
  /** Quiet period (ms) before an untouched charge releases by itself. */
  releaseDelay?: number;
  onCommit?: (payload: { direction: SliderDirection; progress: number; activeIndex: number }) => void;
}

export interface ReusableSliderProps<TItem extends ReusableSliderItem> {
  items: TItem[];
  ariaLabel?: string;
  className?: string;
  infinite?: boolean;
  emptyMessage?: string;
  /** `free` follows the wheel pixel by pixel, `page` moves one item per gesture. */
  wheelStep?: 'free' | 'page';
  /** Listen for the wheel here instead of on the viewport (whole-page scrolling). */
  wheelRoot?: RefObject<HTMLElement | null>;
  pagination?: {
    enabled?: boolean;
    ariaLabel?: string;
    getLabel?: (item: TItem, index: number) => string;
  };
  edgeOverflow?: SliderEdgeOverflowConfig;
  /** Extra class for every slide, so an experience can style its own card. */
  slideClassName?: string;
  getItemId: (item: TItem) => string;
  /** width / height of the visual inside the slide. */
  getSlideAspectRatio: (item: TItem) => number;
  getSlideA11yLabel?: (item: TItem, index: number) => string;
  /** Tells the experience which item the slider has settled on. */
  onActiveIndexChange?: (index: number) => void;
  renderSlide: (item: TItem, index: number) => ReactNode;
}

/**
 * Slider shared by the paintings and projects experiences.
 *
 * `infinite` loops the paintings gallery forever. Without it the track is bounded: it
 * settles on a slide, one wheel gesture moves a single slide, and pushing past an end
 * opens the space for the matching arrow instead of moving the track.
 */
export function ReusableSlider<TItem extends ReusableSliderItem>({
  items,
  ariaLabel,
  className,
  infinite = false,
  emptyMessage = 'No items to display yet.',
  wheelStep = 'free',
  wheelRoot,
  pagination,
  edgeOverflow,
  slideClassName,
  getItemId,
  getSlideAspectRatio,
  getSlideA11yLabel,
  onActiveIndexChange,
  renderSlide,
}: ReusableSliderProps<TItem>) {
  const hasLoop = infinite && items.length > 1;

  const {
    scrollerRef,
    trackRef,
    activeIndex,
    edgeState,
    canCharge,
    subscribeRange,
    scrollToIndex,
    scrollToPosition,
    settle,
    popEdge,
    holdCharge,
    resumeCharge,
  } = useSliderScroll({
    itemCount: items.length,
    infinite: hasLoop,
    wheelStep,
    wheelRoot,
    edgeCharge: {
      enabled: !!edgeOverflow?.enabled,
      distance: edgeOverflow?.chargeWheelDistance,
      releaseDelay: edgeOverflow?.releaseDelay,
      onCommit: ({ direction, progress }) => edgeOverflow?.onCommit?.({ direction, progress, activeIndex }),
    },
  });

  /** Centre the looping track on its middle copy before the first paint. */
  const attachTrack = useMemo(() => (node: HTMLDivElement | null) => {
    trackRef.current = node;
    const scroller = scrollerRef.current;
    if (!node || !scroller || !hasLoop) return;
    const width = node.scrollWidth / 3;
    if (width > 0 && scroller.scrollLeft <= 0) scroller.scrollLeft = width;
  }, [hasLoop, scrollerRef, trackRef]);

  useEffect(() => {
    onActiveIndexChange?.(activeIndex);
  }, [activeIndex, onActiveIndexChange]);

  const slides = useMemo(() => {
    const rendered = hasLoop
      ? [0, 1, 2].flatMap(loopIndex => items.map((item, baseIndex) => ({
        item,
        baseIndex,
        loopIndex,
        key: `${loopIndex}-${getItemId(item)}-${baseIndex}`,
      })))
      : items.map((item, baseIndex) => ({ item, baseIndex, loopIndex: 0, key: `${getItemId(item)}-${baseIndex}` }));

    return rendered.map(({ item, baseIndex, loopIndex, key }) => {
      const label = getSlideA11yLabel?.(item, baseIndex);
      return (
        <figure
          className={`reusable-slider__slide ${slideClassName ?? ''}`}
          key={key}
          style={{ '--slide-ratio': getSlideAspectRatio(item) } as CSSProperties}
          data-base-index={baseIndex}
          data-loop-index={loopIndex}
        >
          {renderSlide(item, baseIndex)}
          {label && <figcaption className="sr-only">{label}</figcaption>}
        </figure>
      );
    });
  }, [getItemId, getSlideA11yLabel, getSlideAspectRatio, hasLoop, items, renderSlide, slideClassName]);

  /** Entrance: the slides rise in whenever the set changes. */
  useEffect(() => {
    const element = scrollerRef.current;
    if (!element || items.length === 0 || prefersReducedMotion()) return;
    const nodes = element.querySelectorAll<HTMLElement>('.reusable-slider__slide');
    const tween = gsap.fromTo(nodes, { autoAlpha: 0, x: 46 }, {
      autoAlpha: 1,
      x: 0,
      duration: 0.8,
      stagger: 0.07,
      ease: 'power3.out',
      clearProps: 'transform,visibility',
    });
    return () => {
      tween.kill();
      gsap.set(nodes, { clearProps: 'opacity,visibility,transform' });
    };
  }, [items.length, scrollerRef, slides]);

  return (
    <div
      className={`reusable-slider ${className ?? ''}`}
      data-edge={edgeState?.direction ?? 'none'}
      data-loop={hasLoop ? 'true' : 'false'}
      style={{ '--edge-progress': edgeState?.progress ?? 0 } as CSSProperties}
    >
      <div className="reusable-slider__frame">
        <div className="reusable-slider__viewport" ref={scrollerRef} aria-label={ariaLabel} tabIndex={0}>
          <div className="reusable-slider__track" ref={attachTrack}>
            {slides}
          </div>
        </div>
        {canCharge && edgeState && (
          <button
            type="button"
            className={`reusable-slider__edge-cta reusable-slider__edge-cta--${edgeState.direction} ${edgeState.popping ? 'reusable-slider__edge-cta--popping' : ''}`}
            aria-hidden="true"
            tabIndex={-1}
            onPointerDown={event => { event.stopPropagation(); holdCharge(); }}
            onPointerEnter={holdCharge}
            onPointerLeave={resumeCharge}
            onFocus={holdCharge}
            onBlur={resumeCharge}
            onClick={() => popEdge(edgeState.direction)}
          >
            <span className={`reusable-slider__edge-arrow reusable-slider__edge-arrow--${edgeState.direction}`}>
              {edgeState.direction === 'next' ? '→' : '←'}
            </span>
          </button>
        )}
      </div>
      {pagination?.enabled && items.length > 1 && (
        <SliderPagination
          itemCount={items.length}
          activeIndex={activeIndex}
          subscribeRange={subscribeRange}
          onScrub={position => scrollToPosition(position)}
          onScrubEnd={position => settle(position)}
          onSelect={index => scrollToIndex(index)}
          getItemLabel={pagination.getLabel ? index => pagination.getLabel?.(items[index], index) ?? '' : undefined}
          ariaLabel={pagination.ariaLabel ?? 'Slider pagination'}
        />
      )}
      {items.length === 0 && <p className="paintings-empty">{emptyMessage}</p>}
    </div>
  );
}
