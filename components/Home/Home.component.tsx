"use client";

import Image from "next/image";
import { RefObject } from "react";
import { IArts } from "@/interfaces";
import { fakeArts } from "@/consts";

const generateStyles = (total: number): React.CSSProperties[] => {
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
      position: "absolute" as const,
      top: `${top}%`,
      left: `${left}%`,
      width,
      height,
      transform: `rotate(${rotate}deg)`,
    };
  });
};

const artStyles = generateStyles(fakeArts.length);

interface HomeSectionProps {
  penRef: RefObject<HTMLImageElement | null>;
  penTextRef: RefObject<HTMLHeadingElement | null>;
  welcomeTextRef: RefObject<HTMLParagraphElement | null>;
  nameTextRef: RefObject<HTMLParagraphElement | null>;
  galleryRef: RefObject<HTMLDivElement | null>;
}

export const HomeComponent = ({
  penRef,
  penTextRef,
  welcomeTextRef,
  nameTextRef,
  galleryRef,
}: HomeSectionProps) => {
  return (
    <section className="flex-1 min-h-0 w-full flex justify-center items-center relative">
      <Image
        ref={penRef}
        src="/images/pen.png"
        alt="pen"
        width={400}
        height={400}
        className="object-cover rotate-342 relative z-10"
      />
      <h5 ref={penTextRef} className="text-6xl relative z-10">
        SCROLL BITCH
      </h5>

      <div className="absolute left-1/2 top-1/2 -translate-y-1/2 pl-8 flex flex-col gap-2 z-10">
        <p ref={welcomeTextRef} className="text-6xl font-medium">
          WELCOME
        </p>
        <p ref={nameTextRef} className="text-5xl font-medium">
          GHAZAL SHAFIEI
        </p>
      </div>

      <div
        ref={galleryRef}
        className="absolute inset-x-0 top-4 bottom-28 overflow-hidden"
      >
        {fakeArts.map((art: IArts, index: number) => (
          <div
            key={art.id}
            style={artStyles[index]}
            className="overflow-hidden"
          >
            <Image
              src={art.uri}
              alt={art.title}
              fill
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
};
