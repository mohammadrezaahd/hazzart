'use client';
import { useRef, useState, type CSSProperties } from 'react';
import { Draggable, gsap, useGSAP } from '@/lib/gsap';
import type { Artwork } from '@/interfaces/Portfolio';
import { ArtworkImage } from '@/components/Artwork/ArtworkImage';
import { ArtworkViewer, type ArtworkSelection } from '@/components/Artwork/ArtworkViewer';
import { usePaperSound } from '@/hooks/usePaperSound';

export function DeskModeComponent({ artworks, arrangementKey }: { artworks: Artwork[]; arrangementKey: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<ArtworkSelection | null>(null);
  const zIndex = useRef(artworks.length);
  const sound = usePaperSound();
  const open = (artwork: Artwork, element: HTMLElement) => {
    gsap.killTweensOf(element);
    setSelection({ artwork, element, rotation: Number(gsap.getProperty(element, 'rotation')) || 0, rect: element.getBoundingClientRect() });
  };
  useGSAP(() => {
    const stage = root.current;
    if (!stage) return;
    const media = gsap.matchMedia();
    media.add({ reduced: '(prefers-reduced-motion: reduce)', motion: '(prefers-reduced-motion: no-preference)' }, context => {
      const reduced = Boolean(context.conditions?.reduced);
      const cards = Array.from(stage.querySelectorAll<HTMLElement>('[data-artwork-id]'));
      zIndex.current = cards.length;
      const drags: Draggable[] = [];
      const timeline = gsap.timeline({ paused: !reduced, delay: reduced ? 0 : 0.12 });
      let disposed = false;
      let startTimer: ReturnType<typeof setTimeout> | undefined;
      cards.forEach((card, i) => {
        const artwork = artworks[i];
        gsap.set(card, { xPercent: -50, yPercent: -50, x: 0, y: 0, rotation: artwork.table.rotation, zIndex: i + 1, autoAlpha: 1 });
        // Entrance transform and drag transform share one owner, never competing.
        if (!reduced) {
          timeline.fromTo(card, { y: -stage.clientHeight * 0.85, x: (i % 2 ? -1 : 1) * 45, scale: 1.12, rotation: artwork.table.rotation + (i % 2 ? -16 : 18), autoAlpha: 0 }, { x: 0, y: 0, scale: 1, rotation: artwork.table.rotation, autoAlpha: 1, duration: 0.72, ease: 'power3.out' }, i * 0.13);
          timeline.to(card, { scale: 0.99, duration: 0.09, yoyo: true, repeat: 1, ease: 'sine.inOut', onStart: sound.play }, i * 0.13 + 0.65);
        }
        const [drag] = Draggable.create(card, {
          type: 'x,y', bounds: stage, inertia: !reduced, edgeResistance: 0.8,
          dragClickables: true, minimumMovement: 6, maxDuration: 0.55,
          onPress() { timeline.killTweensOf(card); gsap.killTweensOf(card); gsap.set(card, { autoAlpha: 1, scale: 1, zIndex: ++zIndex.current }); },
          onDragStart() { card.dataset.dragging = 'true'; },
          onDragEnd() { delete card.dataset.dragging; sound.play(); },
          onClick() { open(artwork, card); },
        });
        drag.disable();
        drags.push(drag);
      });
      // Do not allow a touch to grab a card while it is still above the table.
      timeline.eventCallback('onComplete', () => drags.forEach(drag => { drag.enable(); drag.update(true); }));
      if (reduced) drags.forEach(drag => drag.enable());
      else {
        const images = Array.from(stage.querySelectorAll('img'));
        const ready = Promise.allSettled(images.map(image => image.complete ? Promise.resolve() : image.decode()));
        const timeout = new Promise<void>(resolve => { startTimer = setTimeout(resolve, 4000); });
        void Promise.race([ready, timeout]).then(() => { if (!disposed) timeline.play(); clearTimeout(startTimer); });
      }
      const observer = new ResizeObserver(() => { drags.forEach(drag => { if (!drag.isDragging && (reduced || timeline.progress() === 1)) drag.applyBounds(stage); }); });
      observer.observe(stage);
      return () => { disposed = true; clearTimeout(startTimer); timeline.kill(); observer.disconnect(); drags.forEach(drag => drag.kill()); };
    });
    return () => media.revert();
  }, { scope: root, dependencies: [arrangementKey], revertOnUpdate: true });

  return <>
    <p className="sr-only" id="table-instructions">Drag the artworks to explore the table. Select an artwork or press Enter to view it. Press Escape to return.</p>
    <div className="desk-stage" ref={root} aria-label="Artwork table" aria-describedby="table-instructions">
      {artworks.map(artwork => <button key={artwork.id} type="button" className={`artwork-card ${artwork.table.aspectRatio > 1 ? 'landscape-card' : ''}`} data-artwork-id={artwork.id} aria-label={`View ${artwork.title}`} aria-haspopup="dialog" style={{ '--art-ratio': artwork.table.aspectRatio, transform: `translate(-50%, -50%) rotate(${artwork.table.rotation}deg)` } as CSSProperties} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(artwork, event.currentTarget); } }}>
        <ArtworkImage artwork={artwork} sizes="(max-width: 767px) 55vw, 44vw" priority />
      </button>)}
      {artworks.length === 0 && <p className="empty-table">No artwork in this medium yet.</p>}
    </div>
    <button type="button" className="sound-toggle" aria-pressed={sound.enabled} onClick={sound.toggle}>Sound {sound.enabled ? 'on' : 'off'}</button>
    <span className="sr-only" role="status">{artworks.length} artworks on the table</span>
    {selection && <ArtworkViewer selection={selection} onClose={() => setSelection(null)} />}
  </>;
}
