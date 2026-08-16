"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Image from "next/image";
import { useMemo, useRef, type CSSProperties } from "react";

import { IArts } from "@/interfaces";

interface ListModeComponentProps {
  arts: IArts[];
  rows?: number;
}

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

export const ListModeComponent = ({
  arts,
  rows = 5,
}: ListModeComponentProps) => {
  const rootRef = useRef<HTMLDivElement>(null);

  const listStyles = useMemo(
    () => createListStyles(arts.length, rows),
    [arts.length, rows],
  );

  useGSAP(
    () => {
      if (!rootRef.current) {
        return;
      }

      const items = gsap.utils.toArray<HTMLElement>(
        "[data-gallery-item]",
        rootRef.current,
      );

      gsap.killTweensOf(items);

      gsap.set(items, {
        xPercent: 0,
        opacity: 1,
        scale: 1,
        y: 0,
      });

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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

        gsap.set(items, {
          xPercent: 0,
        });
      };
    },
    {
      dependencies: [arts.length, rows],
      scope: rootRef,
    },
  );

  return (
    <div
      ref={rootRef}
      className="relative h-full w-full overflow-hidden bg-transparent"
    >
      {arts.map((art, index) => {
        const rowIndex = index % Math.max(1, rows);

        return (
          <div
            key={art.id}
            data-gallery-item
            data-gallery-id={art.id}
            data-row-index={rowIndex}
            className="
              absolute
              overflow-hidden
              will-change-transform
            "
            style={listStyles[index]}
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
