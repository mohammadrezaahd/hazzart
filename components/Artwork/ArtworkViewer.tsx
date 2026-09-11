'use client';
import { useCallback, useLayoutEffect, useRef, type CSSProperties } from 'react';
import Image from 'next/image';
import { gsap } from '@/lib/gsap';
import type { Artwork } from '@/interfaces/Portfolio';
import { ArtworkImage } from './ArtworkImage';

export interface ArtworkSelection { artwork: Artwork; element: HTMLElement; rotation: number; rect: DOMRect }
export function ArtworkViewer({ selection, onClose }: { selection: ArtworkSelection; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const closing = useRef(false);
  const { artwork, element, rect, rotation } = selection;
  const getSourceTransform = useCallback((source: DOMRect) => {
    const target = imageRef.current!;
    const dialog = dialogRef.current!;
    // Layout dimensions ignore any in-flight transform (including rapid close).
    return { x: source.left + source.width / 2 - target.offsetLeft - target.offsetWidth / 2, y: source.top + source.height / 2 - target.offsetTop + dialog.scrollTop - target.offsetHeight / 2, scaleX: element.offsetWidth / target.offsetWidth, scaleY: element.offsetHeight / target.offsetHeight, rotation };
  }, [element, rotation]);
  useLayoutEffect(() => {
    const dialog = dialogRef.current!;
    const image = imageRef.current;
    const description = descriptionRef.current;
    dialog.showModal();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sourceTransform = getSourceTransform(rect);
    element.style.visibility = 'hidden';
    const timeline = gsap.timeline();
    timeline.fromTo(dialog, { '--veil-opacity': 0 }, { '--veil-opacity': 0.9, duration: reduced ? 0 : 0.45 }, 0)
      .fromTo(imageRef.current, sourceTransform, { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, duration: reduced ? 0 : 0.68, ease: 'power3.inOut' }, 0)
      .fromTo(descriptionRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: reduced ? 0 : 0.4 }, reduced ? 0 : 0.28);
    return () => { timeline.kill(); gsap.killTweensOf([dialog, image, description]); element.style.visibility = ''; dialog.close(); if (element.isConnected) element.focus({ preventScroll: true }); };
  }, [element, getSourceTransform, rect]);
  const close = () => {
    if (closing.current) return;
    closing.current = true;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Retarget from the current transform so rapid Escape stays continuous.
    const dialog = dialogRef.current;
    const image = imageRef.current;
    const description = descriptionRef.current;
    if (!dialog || !image || !description) return;
    gsap.killTweensOf([image, description, dialog]);
    const destination = getSourceTransform(element.getBoundingClientRect());
    gsap.timeline({ onComplete: () => { element.style.visibility = ''; dialog.close(); onClose(); } })
      .to(description, { opacity: 0, y: 8, duration: reduced ? 0 : 0.16 }, 0)
      .to(dialog, { '--veil-opacity': 0, duration: reduced ? 0 : 0.45 }, 0)
      .to(image, { ...destination, duration: reduced ? 0 : 0.55, ease: 'power3.inOut' }, 0);
  };
  return <dialog ref={dialogRef} className="artwork-viewer" aria-label={artwork.title} aria-describedby="artwork-description" onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === dialogRef.current) close(); }}>
    <button type="button" className="close-button" aria-label="Close artwork" onClick={close}><Image src="/icons/close.svg" width={32} height={32} alt="" /></button>
    <div className={`viewer-image ${artwork.table.aspectRatio > 1 ? 'viewer-landscape' : ''}`} ref={imageRef} style={{ aspectRatio: artwork.table.aspectRatio, '--art-ratio': artwork.table.aspectRatio } as CSSProperties}><ArtworkImage artwork={artwork} sizes="(max-width: 767px) 88vw, 55vw" priority /></div>
    <p ref={descriptionRef} id="artwork-description" className="artwork-description">{artwork.title}, {artwork.year}, {artwork.description}, {artwork.dimensions}</p>
  </dialog>;
}
