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
        px-6
        py-4
      "
    >
      <div className="flex w-1/2 items-center justify-start gap-5">
        <div ref={headerLogoRef} className="logo text-4xl font-bold">
          GHAZAL SHAFIEI
        </div>

        <div className="modes flex flex-col gap-1">
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
          w-8
          cursor-pointer
          flex-col
          items-center
          gap-2
          border-0
          bg-transparent
          p-0
        "
      >
        <span ref={topLineRef} className="block h-0.5 w-8 bg-current" />

        <span ref={middleLineRef} className="block h-0.5 w-4 bg-current" />

        <span ref={bottomLineRef} className="block h-0.5 w-8 bg-current" />
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
