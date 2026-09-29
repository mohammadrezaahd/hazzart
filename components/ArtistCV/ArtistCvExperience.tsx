'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getPublicPortfolio } from '@/components/api/public';



function CvScrollBar({
  scrollRef,
  hasOverflow,
}: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  hasOverflow: boolean;
}) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState(0);
  const dragging = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const updateFromScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    const max = element.scrollHeight - element.clientHeight;
    setPosition(max > 0 ? element.scrollTop / max : 1);
  }, [scrollRef]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    updateFromScroll();
    element.addEventListener('scroll', updateFromScroll, { passive: true });
    const observer = new ResizeObserver(updateFromScroll);
    observer.observe(element);

    return () => {
      element.removeEventListener('scroll', updateFromScroll);
      observer.disconnect();
    };
  }, [scrollRef, updateFromScroll]);

  const seek = useCallback(
    (clientX: number) => {
      const rail = railRef.current;
      const element = scrollRef.current;
      if (!rail || !element) return;

      const rect = rail.getBoundingClientRect();
      const next = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      element.scrollTop = next * (element.scrollHeight - element.clientHeight);
      setPosition(next);
    },
    [scrollRef],
  );

  return (
    <div
      className="artist-cv-scrollbar"
      data-ready={hasOverflow}
      data-dragging={isDragging}
      style={{ '--cv-scroll-position': position } as React.CSSProperties}
    >
      <div
        className="artist-cv-scrollbar__rail"
        ref={railRef}
        role="slider"
        tabIndex={hasOverflow ? 0 : -1}
        aria-label="Artist CV scroll position"
        aria-orientation="horizontal"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position * 100)}
        onPointerDown={(event) => {
          if (!hasOverflow || event.button !== 0) return;
          dragging.current = true;
          setIsDragging(true);
          event.currentTarget.setPointerCapture(event.pointerId);
          seek(event.clientX);
        }}
        onPointerMove={(event) => {
          if (!dragging.current) return;
          seek(event.clientX);
        }}
        onPointerUp={(event) => {
          dragging.current = false;
          setIsDragging(false);
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
        }}
        onPointerCancel={() => {
          dragging.current = false;
          setIsDragging(false);
        }}
        onKeyDown={(event) => {
          const element = scrollRef.current;
          if (!element) return;

          if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            event.preventDefault();
            element.scrollBy({ top: element.clientHeight * 0.85, behavior: 'smooth' });
          } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            event.preventDefault();
            element.scrollBy({ top: -element.clientHeight * 0.85, behavior: 'smooth' });
          } else if (event.key === 'Home') {
            event.preventDefault();
            element.scrollTo({ top: 0, behavior: 'smooth' });
          } else if (event.key === 'End') {
            event.preventDefault();
            element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
          }
        }}
      >
        <span className="artist-cv-scrollbar__line" aria-hidden="true" />
        <span className="artist-cv-scrollbar__fill" aria-hidden="true" />
        <span className="artist-cv-scrollbar__dot" aria-hidden="true" />
      </div>
    </div>
  );
}

export function ArtistCvExperience() {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [cvText, setCvText] = useState<string | null>(null);

  useEffect(() => {
    void getPublicPortfolio().then((data) => setCvText(data.cv)).catch(() => setCvText(null));
  }, []);

  useEffect(() => {
    const element = bodyRef.current;
    if (!element) return;

    const checkOverflow = () => {
      setHasOverflow(element.scrollHeight > element.clientHeight + 1);
    };

    checkOverflow();
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  if (cvText === null) {
    return <main className="artist-cv-experience" id="main-content"><div className="artist-cv__part"><div className="artist-cv__body"><div className="artist-cv__title">CV</div><p>Loading…</p></div></div></main>;
  }

  const paragraphs = cvText.split(/\n\s*\n|\n/).map((text) => text.trim()).filter(Boolean);

  return (
    <main className="artist-cv-experience" id="main-content">
      <div className="artist-cv__part">
        <div className="artist-cv__body" ref={bodyRef} tabIndex={0}>
          <div className="artist-cv__title">CV</div>
          <div className="artist-cv__copy">
            {CV_TEXT.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </div>

      <CvScrollBar scrollRef={bodyRef} hasOverflow={hasOverflow} />
    </main>
  );
}
