"use client";

import { gsap, useGSAP } from "@/lib/gsap";
import { useRef } from "react";

export const useHomeIntroAnimation = () => {
  const rootRef = useRef<HTMLElement>(null);
  const penRef = useRef<HTMLImageElement>(null);
  const penTextRef = useRef<HTMLHeadingElement>(null);
  const welcomeTextRef = useRef<HTMLParagraphElement>(null);
  const nameTextRef = useRef<HTMLParagraphElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const headerLogoRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const rootElement = rootRef.current;
      const penElement = penRef.current;
      const penTextElement = penTextRef.current;
      const welcomeElement = welcomeTextRef.current;
      const nameElement = nameTextRef.current;
      const headerElement = headerRef.current;
      const headerLogoElement = headerLogoRef.current;
      const footerElement = footerRef.current;
      const galleryElement = galleryRef.current;

      if (
        !rootElement ||
        !penElement ||
        !penTextElement ||
        !welcomeElement ||
        !nameElement ||
        !headerElement ||
        !headerLogoElement ||
        !footerElement ||
        !galleryElement
      ) {
        return;
      }

      const media = gsap.matchMedia();

      media.add(
        {
          reduceMotion: "(prefers-reduced-motion: reduce)",
          mobile: "(max-width: 767px)",
          tablet: "(min-width: 768px) and (max-width: 1023px)",
          desktop: "(min-width: 1024px)",
        },
        (context) => {
          const { reduceMotion } = context.conditions as {
            reduceMotion: boolean;
          };

          if (reduceMotion) {
            gsap.set(
              [penElement, penTextElement, welcomeElement, nameElement],
              {
                opacity: 0,
              },
            );
            gsap.set(headerElement, { opacity: 1, yPercent: 0 });
            gsap.set(footerElement, { opacity: 1, yPercent: -60 });
            gsap.set(galleryElement, { opacity: 1 });
            return;
          }

          gsap.set(headerElement, { opacity: 1, yPercent: 0 });

          const nameRect = nameElement.getBoundingClientRect();
          const logoRect = headerLogoElement.getBoundingClientRect();
          const deltaX = logoRect.left - nameRect.left;
          const deltaY = logoRect.top - nameRect.top;
          const scaleRatio = logoRect.width / nameRect.width;

          gsap.set(headerElement, { opacity: 0, yPercent: -10 });
          gsap.set(penElement, { yPercent: 40 });
          gsap.set(penTextElement, { xPercent: -30 });
          gsap.set(footerElement, { opacity: 0, yPercent: 100 });
          gsap.set(welcomeElement, { opacity: 0, yPercent: 30 });
          gsap.set(nameElement, { opacity: 0, yPercent: 30 });
          gsap.set(galleryElement, { opacity: 0 });

          const timeline = gsap.timeline({
            defaults: { ease: "power2.inOut" },
            scrollTrigger: {
              trigger: rootElement,
              start: "top top",
              end: "+=3000",
              scrub: true,
              pin: true,
              invalidateOnRefresh: true,
            },
          });

          timeline.to(penElement, {
            rotate: 10,
            scale: 0.8,
            xPercent: -50,
            yPercent: -20,
            duration: 2,
          });

          timeline.to(penTextElement, { xPercent: 300, duration: 2 });
          timeline.to(
            welcomeElement,
            { opacity: 1, yPercent: 0, duration: 1 },
            "-=0.5",
          );
          timeline.to(
            nameElement,
            { opacity: 1, yPercent: 0, duration: 1 },
            "<+=0.3",
          );
          timeline.to(
            penElement,
            {
              rotate: 71,
              scale: 0.5,
              xPercent: 50,
              yPercent: -40,
              duration: 3,
              opacity: 0,
            },
            "<-=0.8",
          );
          timeline.to(
            welcomeElement,
            { opacity: 0, yPercent: -20, duration: 1 },
            "<+=1",
          );
          timeline.to(
            nameElement,
            {
              x: deltaX,
              y: deltaY,
              scale: scaleRatio,
              transformOrigin: "left top",
              duration: 1.5,
              ease: "power3.inOut",
            },
            "<+=0.3",
          );
          timeline.to(
            headerElement,
            { opacity: 1, duration: 0.5, yPercent: 0 },
            "-=0.2",
          );
          timeline.to(nameElement, { opacity: 0, duration: 0.3 }, "<+=0.3");
          timeline.to(
            footerElement,
            { opacity: 1, duration: 1, yPercent: -60 },
            "<",
          );
          timeline.to(galleryElement, { opacity: 1, duration: 1 }, "<+=0.3");
        },
      );

      return () => media.revert();
    },
    { scope: rootRef },
  );

  return {
    rootRef,
    penRef,
    penTextRef,
    welcomeTextRef,
    nameTextRef,
    headerRef,
    headerLogoRef,
    footerRef,
    galleryRef,
  };
};
