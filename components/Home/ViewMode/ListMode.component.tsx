"use client";

import { gsap, useGSAP } from "@/lib/gsap";
import Image from "next/image";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

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

      width: `clamp(5rem, ${Math.max(12, colWidth * 0.95)}%, 11rem)`,
      height: `clamp(4.5rem, ${Math.max(14, rowHeight * 0.92)}%, 9rem)`,

      transform: "rotate(0deg)",

      borderRadius: 2,
    };
  });
};

const useResponsiveRows = (desktopRows: number) => {
  const [rowCount, setRowCount] = useState(desktopRows);

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 639px)");
    const tabletQuery = window.matchMedia(
      "(min-width: 640px) and (max-width: 1023px)",
    );

    const updateRowCount = () => {
      if (mobileQuery.matches) {
        setRowCount(3);
        return;
      }

      if (tabletQuery.matches) {
        setRowCount(4);
        return;
      }

      setRowCount(desktopRows);
    };

    updateRowCount();
    mobileQuery.addEventListener("change", updateRowCount);
    tabletQuery.addEventListener("change", updateRowCount);

    return () => {
      mobileQuery.removeEventListener("change", updateRowCount);
      tabletQuery.removeEventListener("change", updateRowCount);
    };
  }, [desktopRows]);

  return rowCount;
};

export const ListModeComponent = ({
  arts,
  rows = 5,
}: ListModeComponentProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const responsiveRows = useResponsiveRows(rows);

  const listStyles = useMemo(
    () => createListStyles(arts.length, responsiveRows),
    [arts.length, responsiveRows],
  );

  useGSAP(
    (_, contextSafe) => {
      if (!rootRef.current || !contextSafe) {
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

        const handleEnter = contextSafe(() => {
          gsap.killTweensOf(rowTween);
          gsap.to(rowTween, {
            timeScale: 0.35,
            duration: 0.25,
            ease: "power2.out",
          });
        });

        const handleLeave = contextSafe(() => {
          gsap.killTweensOf(rowTween);
          gsap.to(rowTween, {
            timeScale: 1,
            duration: 0.25,
            ease: "power2.out",
          });
        });

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
      dependencies: [arts.length, responsiveRows],
      scope: rootRef,
      revertOnUpdate: true,
    },
  );

  return (
    <div
      ref={rootRef}
      className="relative h-full w-full overflow-hidden bg-transparent"
    >
      {arts.map((art, index) => {
        const rowIndex = index % Math.max(1, responsiveRows);

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
              sizes="(max-width: 639px) 28vw, (max-width: 1023px) 20vw, 14vw"
              className="object-cover"
              priority={index < 6}
            />
          </div>
        );
      })}
    </div>
  );
};
