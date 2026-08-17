"use client";

import { useCallback, useRef, useState, type RefObject } from "react";

import { GalleryMode } from "@/components/Home/ViewMode";
import { MenuComponent } from "@/components/Layouts/Menu.component";
import { gsap, useGSAP } from "@/lib/gsap";

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [shouldRenderMenu, setShouldRenderMenu] = useState(false);

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const topLineRef = useRef<HTMLSpanElement>(null);
  const middleLineRef = useRef<HTMLSpanElement>(null);
  const bottomLineRef = useRef<HTMLSpanElement>(null);

  const handleMenuToggle = () => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
      return;
    }

    setShouldRenderMenu(true);
    setIsMenuOpen(true);
  };

  const handleMenuCloseComplete = useCallback(() => {
    setShouldRenderMenu(false);
  }, []);

  useGSAP(
    () => {
      const topLine = topLineRef.current;
      const middleLine = middleLineRef.current;
      const bottomLine = bottomLineRef.current;

      if (!topLine || !middleLine || !bottomLine) {
        return;
      }

      gsap.killTweensOf([topLine, middleLine, bottomLine]);

      gsap.to(topLine, {
        y: isMenuOpen ? 10 : 0,
        rotation: isMenuOpen ? 45 : 0,

        duration: 0.35,
        ease: "power2.inOut",
        transformOrigin: "center",
      });

      gsap.to(middleLine, {
        scaleX: isMenuOpen ? 0 : 1,
        opacity: isMenuOpen ? 0 : 1,

        duration: 0.25,
        ease: "power2.inOut",
        transformOrigin: "center",
      });

      gsap.to(bottomLine, {
        y: isMenuOpen ? -10 : 0,
        rotation: isMenuOpen ? -45 : 0,

        duration: 0.35,
        ease: "power2.inOut",
        transformOrigin: "center",
      });
    },
    {
      dependencies: [isMenuOpen],
      scope: menuButtonRef,
    },
  );

  return (
    <header
      ref={headerRef}
      className="
        absolute
        inset-x-0
        top-0
        z-20
        flex
        w-full
        shrink-0
        items-center
        justify-between
        bg-transparent
        px-4
        py-3
        sm:px-6
        sm:py-4
      "
    >
      <div className="flex min-w-0 flex-1 items-center justify-start gap-2 sm:gap-4 lg:gap-5">
        <div
          ref={headerLogoRef}
          className="logo shrink-0 whitespace-nowrap text-xl font-bold sm:text-3xl lg:text-4xl"
        >
          GHAZAL SHAFIEI
        </div>

        <div className="modes flex shrink-0 flex-col gap-0.5 text-[10px] leading-tight sm:gap-1 sm:text-xs lg:text-sm">
          <button
            type="button"
            onClick={() => onModeChange("desk")}
            className={`
              cursor-pointer
              text-left
              transition-opacity
              ${mode === "desk" ? "font-semibold opacity-100" : "opacity-45"}
            `}
          >
            DESK MODE
          </button>

          <button
            type="button"
            onClick={() => onModeChange("list")}
            className={`
              cursor-pointer
              text-left
              transition-opacity
              ${mode === "list" ? "font-semibold opacity-100" : "opacity-45"}
            `}
          >
            LIST MODE
          </button>
        </div>
      </div>

      <button
        ref={menuButtonRef}
        type="button"
        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        aria-expanded={isMenuOpen}
        aria-controls="main-navigation-menu"
        onClick={handleMenuToggle}
        className="
          flex
          w-7
          shrink-0
          cursor-pointer
          flex-col
          items-center
          gap-2
          border-0
          bg-transparent
          p-0
          sm:w-8
        "
      >
        <span
          ref={topLineRef}
          className="block h-0.5 w-7 bg-current sm:w-8"
        />

        <span
          ref={middleLineRef}
          className="block h-0.5 w-3.5 bg-current sm:w-4"
        />

        <span
          ref={bottomLineRef}
          className="block h-0.5 w-7 bg-current sm:w-8"
        />
      </button>

      {shouldRenderMenu && (
        <MenuComponent
          isOpen={isMenuOpen}
          onCloseComplete={handleMenuCloseComplete}
        />
      )}
    </header>
  );
};
