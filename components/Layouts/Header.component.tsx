"use client";

import { RefObject } from "react";

interface HeaderComponentProps {
  headerRef: RefObject<HTMLDivElement | null>;
  headerLogoRef: RefObject<HTMLDivElement | null>;
}

export const HeaderComponent = ({
  headerRef,
  headerLogoRef,
}: HeaderComponentProps) => {
  return (
    <header
      ref={headerRef}
      className="flex justify-between items-center w-full shrink-0 px-6 py-4"
    >
      <div ref={headerLogoRef} className="logo font-bold text-4xl">
        GHAZAL SHAFIEI
      </div>
      <div className="modes flex flex-col">
        <div>DESK MODE</div>
        <div>LIST MODE</div>
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
