"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Image from "next/image";
import { useMemo, useRef, type CSSProperties } from "react";
import { IArts } from "@/interfaces";

export type GalleryMode = "list" | "desk";

interface GalleryModeProps {
  arts: IArts[];
  mode: GalleryMode;
  rows?: number;
}

const seeded = (seed: number) => {
  const value = Math.sin(seed * 9999) * 10000;
  return value - Math.floor(value);
};

const createListStyles = (total: number, rowCount: number): CSSProperties[] => {
  const rows = Math.max(1, rowCount);
  const cols = Math.max(1, Math.ceil(total / rows));
  const rowHeight = 100 / rows;
  const colWidth = 100 / cols;

  return Array.from({ length: total }, (_, index) => {
    const row = index % rows;
    const col = Math.floor(index / rows);
    const offsetX = row % 2 === 0 ? 0 : colWidth * 0.12;

    return {
      position: "absolute",
      top: `${row * rowHeight + 1}%`,
      left: `${col * colWidth + offsetX}%`,
      width: `${Math.max(12, colWidth * 0.95)}%`,
      height: `${Math.max(14, rowHeight * 0.92)}%`,
      transform: "rotate(0deg)",
      borderRadius: 2,
    };
  });
};

const createDeskStyles = (arts: IArts[]): CSSProperties[] => {
  const cols = 8;
  const rows = Math.max(1, Math.ceil(arts.length / cols));

  return arts.map((art, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const cellW = 100 / cols;
    const cellH = 100 / rows;

    const randomX = seeded(art.id * 17) * cellW * 0.42 - cellW * 0.08;
    const randomY = seeded(art.id * 31) * cellH * 0.4 - cellH * 0.06;
    const rotate = (seeded(art.id * 47) - 0.5) * 28;
    const width = 10 + seeded(art.id * 53) * 8;
    const height = 16 + seeded(art.id * 61) * 11;

    return {
      position: "absolute",
      top: `${row * cellH + randomY}%`,
      left: `${col * cellW + randomX}%`,
      width: `${width}%`,
      height: `${height}%`,
      transform: `rotate(${rotate}deg)`,
      borderRadius: 2,
    };
  });
};

export const GalleryModeComponent = ({
  arts,
  mode,
  rows = 5,
}: GalleryModeProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const listStyles = useMemo(() => createListStyles(arts.length, rows), [arts.length, rows]);
  const deskStyles = useMemo(() => createDeskStyles(arts), [arts]);

  useGSAP(() => {
    if (!rootRef.current) {
      return;
    }

    const items = gsap.utils.toArray<HTMLElement>("[data-gallery-item]", rootRef.current);
    gsap.set(items, { xPercent: 0 });

    if (mode !== "list" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.killTweensOf(items);
      return;
    }

    const rowIndexes = Array.from(
      new Set(items.map((item) => Number(item.dataset.rowIndex ?? 0))),
    ).sort((a, b) => a - b);

    const rowTweens = new Map<number, gsap.core.Tween>();

    rowIndexes.forEach((rowIndex) => {
      const rowItems = items.filter(
        (item) => Number(item.dataset.rowIndex ?? 0) === rowIndex,
      );
      const toLeft = rowIndex % 2 === 0;

      const tween = gsap.to(rowItems, {
        xPercent: toLeft ? -18 : 18,
        duration: 6.2 + rowIndex * 0.65,
        ease: "none",
        repeat: -1,
        yoyo: true,
      });

      rowTweens.set(rowIndex, tween);
    });

    const cleanups: Array<() => void> = [];

    items.forEach((item) => {
      const rowIndex = Number(item.dataset.rowIndex ?? 0);
      const rowTween = rowTweens.get(rowIndex);

      if (!rowTween) {
        return;
      }

      const handleEnter = () => {
        gsap.to(rowTween, {
          timeScale: 0.35,
          duration: 0.25,
          ease: "power2.out",
        });
      };

      const handleLeave = () => {
        gsap.to(rowTween, {
          timeScale: 1,
          duration: 0.25,
          ease: "power2.out",
        });
      };

      item.addEventListener("mouseenter", handleEnter);
      item.addEventListener("mouseleave", handleLeave);

      cleanups.push(() => {
        item.removeEventListener("mouseenter", handleEnter);
        item.removeEventListener("mouseleave", handleLeave);
      });
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      rowTweens.forEach((tween) => tween.kill());
      gsap.set(items, { xPercent: 0 });
    };
  }, [mode, arts.length, rows]);

  return (
    <div
      ref={rootRef}
      className="relative h-full w-full overflow-hidden bg-transparent"
      data-gallery-mode={mode}
    >
      {arts.map((art, index) => {
        const style = mode === "list" ? listStyles[index] : deskStyles[index];
        const rowIndex = index % Math.max(1, rows);

        return (
          <div
            key={art.id}
            data-gallery-item
            data-gallery-id={art.id}
            data-row-index={rowIndex}
            className="absolute overflow-hidden"
            style={style}
          >
            <Image
              src={art.uri}
              alt={art.title}
              fill
              sizes="(max-width: 1024px) 30vw, 14vw"
              className="object-cover"
              priority={index < 6}
            />
          </div>
        );
      })}
    </div>
  );
};
