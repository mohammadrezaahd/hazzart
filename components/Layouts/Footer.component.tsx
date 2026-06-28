"use client";

import { RefObject } from "react";

interface FooterComponentProps {
  footerRef: RefObject<HTMLDivElement | null>;
}

export const FooterComponent = ({ footerRef }: FooterComponentProps) => {
  return (
    <footer
      ref={footerRef}
      className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-20"
    >
      <div className="bg-[#1A1A1A] flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-sm shadow-2xl">
        {(["YEARLY", "SERIES", "RANDOM", "RECENT"] as const).map((label) => (
          <button
            key={label}
            className="
              text-white text-[10px] sm:text-xs tracking-widest uppercase
              px-3 sm:px-4 py-2 sm:py-2.5
              hover:bg-white hover:text-black
              transition-colors duration-150
              cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white
              min-w-[60px] sm:min-w-[72px] text-center
              whitespace-nowrap
            "
          >
            {label}
          </button>
        ))}
      </div>
    </footer>
  );
};
