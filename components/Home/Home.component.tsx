"use client";

import Image from "next/image";
import { RefObject, useEffect, useRef, useState } from "react";
import { IArts } from "@/interfaces";
import { fakeArts } from "@/consts";

interface GalleryItem {
  position: "absolute";
  top: string;
  left: string;
  width: number;
  height: number;
  transform: string;
}

const generateStyles = (
  total: number,
  isMobile: boolean,
  isTablet: boolean,
): GalleryItem[] => {
  const cols = isMobile ? 4 : isTablet ? 6 : 8;
  const rows = Math.ceil(total / cols);

  const seededRandom = (seed: number) => {
    const x = Math.sin(seed + 1) * 10000;
    return x - Math.floor(x);
  };

  return Array.from({ length: total }, (_, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const cellW = 100 / cols;
    const cellH = 100 / rows;

    const r1 = seededRandom(index * 3);
    const r2 = seededRandom(index * 3 + 1);
    const r3 = seededRandom(index * 3 + 2);

    const left = col * cellW + r1 * cellW * 0.4 - cellW * 0.05;
    const top = row * cellH + r2 * cellH * 0.4 - cellH * 0.05;
    const rotate = (r3 - 0.5) * 28;

    const minW = isMobile ? 70 : isTablet ? 90 : 120;
    const maxW = isMobile ? 90 : isTablet ? 110 : 120;
    const minH = isMobile ? 80 : isTablet ? 100 : 120;
    const maxH = isMobile ? 100 : isTablet ? 120 : 140;

    const r4 = seededRandom(index * 3 + 3);
    const r5 = seededRandom(index * 3 + 4);

    const width = minW + r4 * maxW;
    const height = minH + r5 * maxH;

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
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const artStylesRef = useRef<GalleryItem[]>([]);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const mobile = w < 768;
      const tablet = w >= 768 && w < 1024;
      setIsMobile(mobile);
      setIsTablet(tablet);
      artStylesRef.current = generateStyles(fakeArts.length, mobile, tablet);
    };

    update();
    setMounted(true);

    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <section className="flex-1 min-h-0 w-full flex justify-center items-center relative">
      <Image
        ref={penRef}
        src="/images/pen.png"
        alt="pen"
        width={isMobile ? 200 : isTablet ? 300 : 400}
        height={isMobile ? 200 : isTablet ? 300 : 400}
        className="object-cover rotate-342 relative z-10 select-none"
        priority
      />
      <h5
        ref={penTextRef}
        className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight relative z-10 ml-3 sm:ml-4 md:ml-6 select-none"
      >
        SCROLL BITCH
      </h5>

      <div className="absolute left-1/2 top-1/2 -translate-y-1/2 pl-6 sm:pl-8 flex flex-col gap-1 sm:gap-2 z-10">
        <p
          ref={welcomeTextRef}
          className="text-3xl sm:text-5xl md:text-6xl font-medium tracking-tight leading-none"
        >
          WELCOME
        </p>
        <p
          ref={nameTextRef}
          className="text-2xl sm:text-4xl md:text-5xl font-medium tracking-tight leading-tight"
        >
          GHAZAL SHAFIEI
        </p>
      </div>

      <div
        ref={galleryRef}
        className="absolute inset-x-0 top-4 bottom-20 sm:bottom-24 md:bottom-28 overflow-hidden"
      >
        {mounted &&
          fakeArts.map((art: IArts, index: number) => (
            <div
              key={art.id}
              style={artStylesRef.current[index]}
              className="overflow-hidden shadow-md"
            >
              <Image
                src={art.uri}
                alt={art.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100px, (max-width: 1024px) 140px, 180px"
              />
            </div>
          ))}
      </div>
    </section>
  );
};
