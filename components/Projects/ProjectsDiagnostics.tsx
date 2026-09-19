'use client';

import { useEffect, useState } from 'react';

/**
 * Tiny read-out of what the slider actually measures, shown only with `?debug` in the
 * URL. Handy when the preview has to be checked without opening dev tools.
 */
export function ProjectsDiagnostics() {
  const [enabled, setEnabled] = useState(false);
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('debug')) return;
    setEnabled(true);
    const read = () => {
      const next: string[] = [];
      next.push(`window      ${window.innerWidth} × ${window.innerHeight}`);
      const page = document.querySelector<HTMLElement>('.projects-experience');
      const slider = document.querySelector<HTMLElement>('.projects-slider');
      const scroller = document.querySelector<HTMLElement>('.projects-slider .reusable-slider__viewport');
      const rail = document.querySelector<HTMLElement>('.slider-pagination__rail');
      const dot = document.querySelector<HTMLElement>('.slider-pagination__dot');
      const slides = document.querySelectorAll('.projects-slider .reusable-slider__slide');

      if (!slider || !scroller) {
        next.push('slider      not found');
        setLines(next);
        return;
      }
      const pageBox = page?.getBoundingClientRect();
      next.push(`page        ${pageBox ? `${Math.round(pageBox.width)} × ${Math.round(pageBox.height)}` : '-'}`);
      const box = slider.getBoundingClientRect();
      next.push(`slider box  ${Math.round(box.width)} × ${Math.round(box.height)} @ ${Math.round(box.left)},${Math.round(box.top)}`);
      next.push(`client      ${scroller.clientWidth}  scroll ${scroller.scrollWidth}  left ${Math.round(scroller.scrollLeft)}`);
      next.push(`max         ${scroller.scrollWidth - scroller.clientWidth}  slides ${slides.length}`);
      next.push(`offsets     ${Array.from(slides).map(node => Math.round((node as HTMLElement).offsetLeft)).join(', ')}`);
      next.push(`edge        ${slider.dataset.edge}  progress ${slider.style.getPropertyValue('--edge-progress') || '0'}`);
      if (rail) {
        const railBox = rail.getBoundingClientRect();
        next.push(`rail box    ${Math.round(railBox.width)} × ${Math.round(railBox.height)} @ ${Math.round(railBox.left)},${Math.round(railBox.top)}  ready ${rail.dataset.ready}`);
        next.push(`range pos   ${rail.style.getPropertyValue('--range-position') || '-'}`);
        if (dot) {
          const dotBox = dot.getBoundingClientRect();
          next.push(`dot box     ${Math.round(dotBox.width)} px @ ${Math.round(dotBox.left)}`);
        }
      } else {
        next.push('rail        not found');
      }
      const bottom = rail?.getBoundingClientRect().bottom ?? box.bottom;
      next.push(`inside page ${bottom <= window.innerHeight ? 'yes' : `no (${Math.round(bottom - window.innerHeight)}px past the fold)`}`);
      setLines(next);
    };
    read();
    const timer = window.setInterval(read, 400);
    return () => window.clearInterval(timer);
  }, []);

  if (!enabled) return null;
  return <pre className="projects-debug" aria-hidden="true">{lines.join('\n')}</pre>;
}
