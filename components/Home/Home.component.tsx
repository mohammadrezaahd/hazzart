"use client";

import Image from "next/image";
import { RefObject } from "react";
import { fakeArts } from "@/consts";
import { DeskModeComponent, ListModeComponent } from "./ViewMode";

interface HomeSectionProps {
  penRef: RefObject<HTMLImageElement | null>;
  penTextRef: RefObject<HTMLHeadingElement | null>;
  welcomeTextRef: RefObject<HTMLParagraphElement | null>;
  nameTextRef: RefObject<HTMLParagraphElement | null>;
  galleryRef?: RefObject<HTMLDivElement | null>;
}

export const HomeComponent = ({
  penRef,
  penTextRef,
  welcomeTextRef,
  nameTextRef,
  galleryRef,
}: HomeSectionProps) => {
  return (
    <section className="flex-1 min-h-0 h-full mx-auto w-11/12 flex justify-center items-center relative">
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
        data-home-gallery="wrapper"
        className="absolute inset-x-0 top-4 bottom-28 overflow-hidden"
      >
        <ListModeComponent arts={fakeArts} />
        {false && <DeskModeComponent arts={fakeArts} />}
      </div>
    </section>
  );
};
