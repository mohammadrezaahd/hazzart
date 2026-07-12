"use client";

import { RefObject } from "react";
import { GalleryMode } from "@/components/Home/ViewMode";

interface HeaderComponentProps {
  headerRef: RefObject<HTMLDivElement | null>;
  headerLogoRef: RefObject<HTMLDivElement | null>;
  mode: GalleryMode;
  onModeChange: (mode: GalleryMode) => void;
}

export const HeaderComponent = ({
  headerRef,
  headerLogoRef,
  mode,
  onModeChange,
}: HeaderComponentProps) => {
  return (
    <header
      ref={headerRef}
      className="flex justify-between items-center w-full shrink-0 px-6 py-4"
    >
      <div ref={headerLogoRef} className="logo font-bold text-4xl">
        GHAZAL SHAFIEI
      </div>
      <div className="modes flex flex-col gap-1">
        <button
          type="button"
          onClick={() => onModeChange("desk")}
          className={`text-left cursor-pointer transition-opacity ${
            mode === "desk" ? "opacity-100 font-semibold" : "opacity-45"
          }`}
        >
          DESK MODE
        </button>
        <button
          type="button"
          onClick={() => onModeChange("list")}
          className={`text-left cursor-pointer transition-opacity ${
            mode === "list" ? "opacity-100 font-semibold" : "opacity-45"
          }`}
        >
          LIST MODE
        </button>
      </div>
      <div className="nav flex flex-col">
        <div>DIGITAL ARTWORK</div>
        <div>TRADITIONAL ARTWORK</div>
        <div>GRAPHIC DESIGN</div>
      </div>
      <div className="pages flex flex-col">
        <div>CONTACT</div>
        <div>ABOUT</div>
      </div>
    </header>
  );
};
