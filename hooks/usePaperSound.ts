'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export function usePaperSound() {
  const [enabled, setEnabled] = useState(false);
  const enabledRef = useRef(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => () => { audio.current?.pause(); }, []);
  const play = useCallback(() => {
    if (!enabledRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    audio.current ??= new Audio('/audio/paper-drop.wav');
    audio.current.volume = 0.22;
    audio.current.currentTime = 0;
    void audio.current.play().catch(() => { /* Audio may be blocked; motion still works. */ });
  }, []);
  const toggle = () => {
    enabledRef.current = !enabledRef.current;
    setEnabled(enabledRef.current);
    if (enabledRef.current) {
      // The toggle itself is a trusted user gesture, so this also unlocks
      // playback before the automatic landing sounds run.
      play();
    } else {
      audio.current?.pause();
    }
  };
  return { enabled, toggle, play };
}
