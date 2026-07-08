"use client";

import Image from "next/image";
import { useMemo, type CSSProperties } from "react";
import { IArts } from "@/interfaces";

const generateStyles = (total: number): CSSProperties[] => {
  const cols = 8;
  const rows = Math.ceil(total / cols);

  return Array.from({ length: total }, (_, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const cellW = 100 / cols;
    const cellH = 100 / rows;
    const left = col * cellW + Math.random() * cellW * 0.4 - cellW * 0.05;
    const top = row * cellH + Math.random() * cellH * 0.4 - cellH * 0.05;
    const rotate = (Math.random() - 0.5) * 28;
    const width = 120 + Math.random() * 120;
    const height = 120 + Math.random() * 140;

    return {
      position: "absolute",
      top: `${top}%`,
      left: `${left}%`,
      width,
      height,
      transform: `rotate(${rotate}deg)`,
    };
  });
};

interface DeskModeProps {
  arts: IArts[];
}

export const DeskModeComponent = ({ arts }: DeskModeProps) => {
  const styles = useMemo(() => generateStyles(arts.length), [arts.length]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {arts.map((art: IArts, index: number) => (
        <div key={art.id} style={styles[index]} className="overflow-hidden">
          <Image src={art.uri} alt={art.title} fill className="object-cover" />
        </div>
      ))}
    </div>
  );
};
