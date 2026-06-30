"use client";

import { RefObject } from "react";

interface FooterComponentProps {
  footerRef: RefObject<HTMLDivElement | null>;
}

export const FooterComponent = ({ footerRef }: FooterComponentProps) => {
  return (
    <footer
      ref={footerRef}
      className="bg-[#1E1E1E] flex justify-between items-center self-center px-3 py-4 gap-3 bottom-8"
    >
      <button className="bg-black text-white p-2">YEARLY</button>
      <button className="bg-black text-white p-2">SERIES</button>
      <button className="bg-black text-white p-2">RANDOM</button>
      <button className="bg-black text-white p-2">RECENT</button>
    </footer>
  );
};
