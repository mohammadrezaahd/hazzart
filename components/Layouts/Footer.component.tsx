"use client";

import { RefObject, useLayoutEffect, useRef, useState } from "react";

interface FooterComponentProps {
  footerRef: RefObject<HTMLDivElement | null>;
}

const items = ["YEARLY", "SERIES", "RANDOM", "RECENT"];

export const FooterComponent = ({ footerRef }: FooterComponentProps) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const navigationRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const [indicatorStyle, setIndicatorStyle] = useState({
    width: 0,
    x: 0,
  });

  useLayoutEffect(() => {
    const navigation = navigationRef.current;

    const updateIndicator = () => {
      const activeButton = buttonsRef.current[activeIndex];

      if (!activeButton) {
        return;
      }

      setIndicatorStyle({
        width: activeButton.offsetWidth,
        x: activeButton.offsetLeft,
      });
    };

    updateIndicator();

    if (!navigation) {
      return;
    }

    const resizeObserver = new ResizeObserver(updateIndicator);
    resizeObserver.observe(navigation);

    return () => resizeObserver.disconnect();
  }, [activeIndex]);

  return (
    <footer
      ref={footerRef}
      className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center bg-transparent px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-4"
    >
      <div
        ref={navigationRef}
        className="relative grid w-full max-w-lg grid-cols-4 items-center gap-1 sm:gap-2"
      >
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
              cursor-pointer
              relative
              z-10
              rounded-xl
              bg-transparent
              px-1.5
              py-2
              text-[10px]
              font-bold
              transition-colors
              duration-300
              sm:px-3
              sm:py-2.5
              sm:text-xs
              lg:px-5
              lg:py-3
              lg:text-sm
              ${activeIndex === index ? "text-white" : "text-black"}
            `}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-2 h-0.5 w-full max-w-80 rounded-2xl bg-current sm:mt-3 sm:h-1 sm:max-w-92" />
    </footer>
  );
};
