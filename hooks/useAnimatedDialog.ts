'use client';
import { useCallback, useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';

/** Native modal semantics provide focus trapping and make the background inert. */
export function useAnimatedDialog(onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  const closing = useRef(false);
  const close = useCallback(() => {
    if (closing.current || !ref.current) return;
    closing.current = true;
    gsap.to(ref.current, { opacity: 0, duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 0.22, onComplete: () => { ref.current?.close(); onClose(); } });
  }, [onClose]);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    dialog.showModal();
    const tween = gsap.fromTo(dialog, { opacity: 0 }, { opacity: 1, duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 0.3 });
    return () => { tween.kill(); gsap.killTweensOf(dialog); dialog.close(); previousFocus?.focus({ preventScroll: true }); };
  }, []);
  return { ref, close };
}
