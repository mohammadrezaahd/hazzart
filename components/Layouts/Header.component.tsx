"use client";

import { RefObject, useState } from "react";

interface HeaderComponentProps {
  headerRef: RefObject<HTMLDivElement | null>;
  headerLogoRef: RefObject<HTMLDivElement | null>;
}

export const HeaderComponent = ({
  headerRef,
  headerLogoRef,
}: HeaderComponentProps) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      ref={headerRef}
      className="relative flex justify-between items-center w-full shrink-0 px-4 py-3 md:px-6 md:py-4 z-50"
    >
      <div
        ref={headerLogoRef}
        className="logo font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl tracking-tight leading-none"
      >
        GHAZAL SHAFIEI
      </div>

      <button
        className="md:hidden flex flex-col gap-1.5 p-2 cursor-pointer focus:outline-none"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
      >
        <span
          className={`block w-6 h-0.5 bg-black transition-all duration-200 ${menuOpen ? "rotate-45 translate-y-2" : ""}`}
        />
        <span
          className={`block w-6 h-0.5 bg-black transition-all duration-200 ${menuOpen ? "opacity-0" : ""}`}
        />
        <span
          className={`block w-6 h-0.5 bg-black transition-all duration-200 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}
        />
      </button>

      <nav className="hidden md:flex items-start gap-8 lg:gap-12">
        <div className="modes flex flex-col gap-1 text-xs lg:text-sm tracking-widest text-neutral-500 uppercase">
          <button className="text-left hover:text-black transition-colors duration-150 cursor-pointer">
            DESK MODE
          </button>
          <button className="text-left hover:text-black transition-colors duration-150 cursor-pointer">
            LIST MODE
          </button>
        </div>

        <div className="nav flex flex-col gap-1 text-xs lg:text-sm tracking-widest text-neutral-500 uppercase">
          <button className="text-left hover:text-black transition-colors duration-150 cursor-pointer">
            DIGITAL ARTWORK
          </button>
          <button className="text-left hover:text-black transition-colors duration-150 cursor-pointer">
            TRADITIONAL ARTWORK
          </button>
          <button className="text-left hover:text-black transition-colors duration-150 cursor-pointer">
            GRAPHIC DESIGN
          </button>
        </div>

        <div className="pages flex flex-col gap-1 text-xs lg:text-sm tracking-widest text-neutral-500 uppercase">
          <button className="text-left hover:text-black transition-colors duration-150 cursor-pointer">
            CONTACT
          </button>
          <button className="text-left hover:text-black transition-colors duration-150 cursor-pointer">
            ABOUT
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-t border-neutral-100 shadow-lg md:hidden z-50 px-4 py-6 flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] tracking-widest text-neutral-400 uppercase">
              View
            </span>
            <button className="text-left text-sm tracking-widest uppercase hover:text-neutral-500 transition-colors cursor-pointer">
              DESK MODE
            </button>
            <button className="text-left text-sm tracking-widest uppercase hover:text-neutral-500 transition-colors cursor-pointer">
              LIST MODE
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-[10px] tracking-widest text-neutral-400 uppercase">
              Work
            </span>
            <button className="text-left text-sm tracking-widest uppercase hover:text-neutral-500 transition-colors cursor-pointer">
              DIGITAL ARTWORK
            </button>
            <button className="text-left text-sm tracking-widest uppercase hover:text-neutral-500 transition-colors cursor-pointer">
              TRADITIONAL ARTWORK
            </button>
            <button className="text-left text-sm tracking-widest uppercase hover:text-neutral-500 transition-colors cursor-pointer">
              GRAPHIC DESIGN
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-[10px] tracking-widest text-neutral-400 uppercase">
              Info
            </span>
            <button className="text-left text-sm tracking-widest uppercase hover:text-neutral-500 transition-colors cursor-pointer">
              CONTACT
            </button>
            <button className="text-left text-sm tracking-widest uppercase hover:text-neutral-500 transition-colors cursor-pointer">
              ABOUT
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
