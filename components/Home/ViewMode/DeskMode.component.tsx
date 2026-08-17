"use client";

import { Draggable, gsap, useGSAP } from "@/lib/gsap";
import Image from "next/image";
import { useMemo, useRef, type CSSProperties } from "react";

import { IArts } from "@/interfaces";


interface DeskModeComponentProps {
  arts: IArts[];
}

const mulberry32 = (seed: number) => {
  let t = seed;

  return () => {
    t |= 0;
    t = (t + 0x6d2b79f5) | 0;

    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;

    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const createDeskStyles = (arts: IArts[]): CSSProperties[] => {
  const total = arts.length;

  if (!total) {
    return [];
  }

  return arts.map((art, index) => {
    const rand = mulberry32(art.id * 1000 + 7);

    const rx = rand();
    const ry = rand();
    const rr = rand();
    const rz = rand();

    const offsetX = (rx - 0.5) * 10; // vmin
    const offsetY = (ry - 0.5) * 10; // vmin

    const rotate = (rr - 0.5) * 22;

    const widthVmin = 22;
    const heightVmin = 30;

    return {
      position: "absolute",

      top: `calc(50% + ${offsetY}vmin)`,
      left: `calc(50% + ${offsetX}vmin)`,

      width: `${widthVmin}vmin`,
      height: `${heightVmin}vmin`,

      transform: `translate(-50%, -50%) rotate(${rotate}deg)`,

      transformOrigin: "center",

      zIndex: Math.round(rz * total) + index,

      borderRadius: 2,

      boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
    };
  });
};

export const DeskModeComponent = ({ arts }: DeskModeComponentProps) => {
  const rootRef = useRef<HTMLDivElement>(null);

  const deskStyles = useMemo(() => createDeskStyles(arts), [arts]);

  useGSAP(
    () => {
      if (!rootRef.current) {
        return;
      }

      const items = gsap.utils.toArray<HTMLElement>(
        "[data-gallery-item]",
        rootRef.current,
      );
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const draggables = Draggable.create(items, {
        type: "x,y",
        bounds: rootRef.current,
        inertia: !reduceMotion,
        edgeResistance: 0.65,
        onPress() {
          gsap.set(this.target, { zIndex: 999 });
        },
      });

      return () => {
        draggables.forEach((instance) => instance.kill());
      };
    },
    {
      dependencies: [arts.length],
      scope: rootRef,
      revertOnUpdate: true,
    },
  );

  return (
    <div
      ref={rootRef}
      className="relative h-full w-full overflow-hidden bg-transparent flex items-center justify-center"
    >
      {arts.map((art, index) => (
        <div
          key={art.id}
          data-gallery-item
          data-gallery-id={art.id}
          className="
            absolute
            top-1/2
            left-1/2
            overflow-hidden
            will-change-transform
            cursor-grab
            active:cursor-grabbing
          "
          style={deskStyles[index]}
        >
          <Image
            src={art.uri}
            alt={art.title}
            fill
            sizes="30vw"
            className="object-cover pointer-events-none"
            priority={index < 6}
          />
        </div>
      ))}
    </div>
  );
};
