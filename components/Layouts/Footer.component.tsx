"use client";

import { RefObject, useLayoutEffect, useRef, useState } from "react";

interface FooterComponentProps {
  footerRef: RefObject<HTMLDivElement | null>;
}

const items = ["YEARLY", "SERIES", "RANDOM", "RECENT"];

export const FooterComponent = ({ footerRef }: FooterComponentProps) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const [indicatorStyle, setIndicatorStyle] = useState({
    width: 0,
    x: 0,
  });

  useLayoutEffect(() => {
    const activeButton = buttonsRef.current[activeIndex];

    if (!activeButton) return;

    setIndicatorStyle({
      width: activeButton.offsetWidth,
      x: activeButton.offsetLeft,
    });
  }, [activeIndex]);

  return (
    <footer
      ref={footerRef}
      className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center justify-between self-center bg-transparent"
    >
      <div className="relative flex items-center justify-between gap-4">
        {/* Active background */}
        <div
          className="
            absolute
            top-0
            left-0
            h-full
            rounded-xl
            bg-black
            transition-all
            duration-300
            ease-in-out
          "
          style={{
            width: indicatorStyle.width,
            transform: `translateX(${indicatorStyle.x}px)`,
          }}
        />

        {items.map((item, index) => (
          <button
            key={item}
            ref={(element) => {
              buttonsRef.current[index] = element;
            }}
            onClick={() => setActiveIndex(index)}
            className={`
              relative
              z-10
              rounded-xl
              bg-transparent
              px-5
              py-3
              font-bold
              transition-colors
              duration-300
              ${activeIndex === index ? "text-white" : "text-black"}
            `}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-3 h-1 w-92 rounded-2xl bg-current" />
    </footer>
  );
};
