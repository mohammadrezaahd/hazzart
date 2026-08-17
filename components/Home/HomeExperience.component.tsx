"use client";

import { useState } from "react";

import { FooterComponent, HeaderComponent } from "@/components/Layouts";
import { useHomeIntroAnimation } from "@/hooks";
import { GalleryMode } from "./ViewMode";
import { HomeComponent } from "./Home.component";

export const HomeExperience = () => {
  const [mode, setMode] = useState<GalleryMode>("desk");
  const animationRefs = useHomeIntroAnimation();

  const handleModeChange = (nextMode: GalleryMode) => {
    setMode((currentMode) =>
      currentMode === nextMode ? currentMode : nextMode,
    );
  };

  return (
    <main
      ref={animationRefs.rootRef}
      className="relative h-dvh min-h-[30rem] w-full overflow-hidden bg-white"
    >
      <HeaderComponent
        headerRef={animationRefs.headerRef}
        headerLogoRef={animationRefs.headerLogoRef}
        mode={mode}
        onModeChange={handleModeChange}
      />

      <HomeComponent
        penRef={animationRefs.penRef}
        penTextRef={animationRefs.penTextRef}
        welcomeTextRef={animationRefs.welcomeTextRef}
        nameTextRef={animationRefs.nameTextRef}
        galleryRef={animationRefs.galleryRef}
        mode={mode}
      />

      <FooterComponent footerRef={animationRefs.footerRef} />
    </main>
  );
};
