"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Image from "next/image";
import { useMemo, useRef } from "react";
import { IArts } from "@/interfaces";

interface ListModeProps {
  arts: IArts[];
  rows?: number;
}

const chunkByRows = (arts: IArts[], rowCount: number): IArts[][] => {
  const safeRows = Math.max(1, rowCount);
  const buckets = Array.from({ length: safeRows }, () => [] as IArts[]);

  arts.map((art, index) => {
    buckets[index % safeRows].push(art);
  });

  return buckets.map((row) => (row.length > 0 ? row : arts));
};

export const ListModeComponent = ({
  arts,
  rows = 5,
}: ListModeProps) => {
  const rootRef = useRef<HTMLDivElement>(null);

  const rowGroups = useMemo(() => {
    if (!arts.length) {
      return [] as IArts[][];
    }

    return chunkByRows(arts, rows).map((row) => [...row, ...row]);
  }, [arts, rows]);

  useGSAP(() => {
    if (!rootRef.current || rowGroups.length === 0) {
      return;
    }

    const tracks = gsap.utils.toArray<HTMLDivElement>(
      "[data-list-track]",
      rootRef.current,
    );

    tracks.forEach((track, index) => {
      const toLeft = index % 2 === 0;
      const from = toLeft ? 0 : -50;
      const to = toLeft ? -50 : 0;

      gsap.set(track, { xPercent: from });
      gsap.to(track, {
        xPercent: to,
        duration: 24 + index * 2,
        ease: "none",
        repeat: -1,
      });
    });
  }, [rowGroups.length]);

  return (
    <div ref={rootRef} className="h-full w-full overflow-hidden">
      <div className="h-full w-full flex flex-col">
        {rowGroups.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex-1 overflow-hidden">
            <div data-list-track className="flex h-full w-[200%]">
              {row.map((art, artIndex) => (
                <div
                  key={`${art.id}-${rowIndex}-${artIndex}`}
                  className="relative h-full flex-none w-[14vw] min-w-45"
                >
                  <Image
                    src={art.uri}
                    alt={art.title}
                    fill
                    sizes="14vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
