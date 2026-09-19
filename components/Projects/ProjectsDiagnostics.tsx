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
      const viewport = window.innerWidth;
      const viewportHeight = window.innerHeight;
      next.push(`window      ${viewport} × ${viewportHeight}`);
      const slider = document.querySelector<HTMLElement>('.projects-slider');
      const scroller = document.querySelector<HTMLElement>('.projects-slider .reusable-slider__viewport');
      const rail = document.querySelector<HTMLElement>('.slider-pagination__rail');
      const slides = document.querySelectorAll('.projects-slider .reusable-slider__slide');
      if (!slider || !scroller) {
        next.push('slider      not found');
        setLines(next);
        return;
      }
      const badge = slider.getBoundingClientRect();
      next.push(`slider box  ${Math.round(badge.width)} × ${Math.round(badge.height)} @ ${Math.round(badge.left)},${Math.round(badge.top)}`);
      next.push(`client      ${scroller.clientWidth}  scroll ${scroller.scrollWidth}  left ${Math.round(scroller.scrollLeft)}`);
      next.push(`max         ${scroller.scrollWidth - scroller.clientWidth}  slides ${slides.length}`);
      next.push(`offsets     ${Array.from(slides).map(node => Math.round((node as HTMLElement).offsetLeft)).join(', ')}`);
      next.push(`edge        ${slider.dataset.edge}  progress ${slider.style.getPropertyValue('--edge-progress') || '0'}`);
      if (rail) {
        next.push(`rail        ${Math.round(rail.getBoundingClientRect().width)} px  ready ${rail.dataset.ready}`);
        next.push(`thumb       start ${rail.style.getPropertyValue('--thumb-start') || '-'}  size ${rail.style.getPropertyValue('--thumb-size') || '-'}`);
        const thumb = rail.querySelector<HTMLElement>('[data-slider-thumb]');
        if (thumb) {
          const box = thumb.getBoundingClientRect();
          next.push(`thumb box   ${Math.round(box.width)} px wide @ ${Math.round(box.left)} (visible ${getComputedStyle(thumb).opacity})`);
        }
      }
      const railBox = rail?.getBoundingClientRect();
      next.push(`rail box    ${railBox ? `${Math.round(railBox.width)} × ${Math.round(railBox.height)} @ ${Math.round(railBox.left)},${Math.round(railBox.top)}` : '-'}`);
      setLines(next);
    };
    read();
    const timer = window.setInterval(read, 400);
    return () => window.clearInterval(timer);
  }, []);

  if (!enabled) return null;
  return <pre className="projects-debug" aria-hidden="true">{lines.join('\n')}</pre>;
}
