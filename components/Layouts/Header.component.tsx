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
      className="absolute inset-x-0 top-0 z-20 flex justify-between items-center w-full shrink-0 px-6 py-4 bg-transparent"
    >
      <div className="flex gap-5 justify-start items-center w-1/2">
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
      </div>

      <div className="flex w-8 flex-col items-center gap-2">
        <div className="h-0.5 w-8 bg-current" />
        <div className="h-0.5 w-4 bg-current" />
        <div className="h-0.5 w-8 bg-current" />
      </div>
    </header>
  );
};
