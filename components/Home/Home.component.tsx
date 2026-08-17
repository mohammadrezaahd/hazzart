"use client";

import Image from "next/image";
import { RefObject } from "react";
import { fakeArts } from "@/consts";
import { GalleryMode, GalleryModeComponent } from "./ViewMode";

interface HomeSectionProps {
  penRef: RefObject<HTMLImageElement | null>;
  penTextRef: RefObject<HTMLHeadingElement | null>;
  welcomeTextRef: RefObject<HTMLParagraphElement | null>;
  nameTextRef: RefObject<HTMLParagraphElement | null>;
  galleryRef?: RefObject<HTMLDivElement | null>;
  mode: GalleryMode;
}

export const HomeComponent = ({
  penRef,
  penTextRef,
  welcomeTextRef,
  nameTextRef,
  galleryRef,
  mode,
}: HomeSectionProps) => {
  return (
    <section className="absolute inset-0 z-0 mx-auto flex w-full flex-col items-center justify-center px-4 sm:w-11/12 sm:flex-row sm:px-0">
      <Image
        ref={penRef}
        src="/images/pen.png"
        alt="pen"
        width={400}
        height={400}
        className="relative z-10 h-auto w-[clamp(10rem,42vw,25rem)] rotate-342 object-cover"
      />
      <h5
        ref={penTextRef}
        className="relative z-10 whitespace-nowrap text-2xl sm:text-4xl lg:text-6xl"
      >
        SCROLL BITCH
      </h5>

      <div className="absolute left-4 right-4 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-1 sm:left-1/2 sm:right-auto sm:gap-2 sm:pl-8">
        <p
          ref={welcomeTextRef}
          className="text-4xl font-medium sm:text-5xl lg:text-6xl"
        >
          WELCOME
        </p>
        <p
          ref={nameTextRef}
          className="whitespace-nowrap text-2xl font-medium sm:text-4xl lg:text-5xl"
        >
          GHAZAL SHAFIEI
        </p>
      </div>

      <div
        ref={galleryRef}
        data-home-gallery="wrapper"
        className="absolute inset-x-0 bottom-20 top-[4.5rem] flex items-center justify-center overflow-hidden sm:bottom-28 sm:top-24"
      >
        <GalleryModeComponent arts={fakeArts} mode={mode} />
      </div>
    </section>
  );
};
