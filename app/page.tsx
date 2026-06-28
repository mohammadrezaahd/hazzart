"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import gsap from "gsap";
import { HomeComponent, HeaderComponent, FooterComponent } from "@/components";

const Home = () => {
  const penRef = useRef<HTMLImageElement>(null);
  const penTextRef = useRef<HTMLHeadingElement>(null);
  const welcomeTextRef = useRef<HTMLParagraphElement>(null);
  const nameTextRef = useRef<HTMLParagraphElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const headerLogoRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (
      !penRef.current ||
      !headerRef.current ||
      !headerLogoRef.current ||
      !footerRef.current ||
      !penTextRef.current ||
      !welcomeTextRef.current ||
      !nameTextRef.current ||
      !galleryRef.current
    )
      return;

    const penElement = penRef.current;
    const penTextElement = penTextRef.current;
    const welcomeElement = welcomeTextRef.current;
    const nameElement = nameTextRef.current;
    const headerElement = headerRef.current;
    const headerLogoElement = headerLogoRef.current;
    const footerElement = footerRef.current;
    const galleryElement = galleryRef.current;

    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

    gsap.set(headerElement, { opacity: 1, yPercent: 0 });
    const nameRect = nameElement.getBoundingClientRect();
    const logoRect = headerLogoElement.getBoundingClientRect();
    gsap.set(headerElement, { opacity: 0, yPercent: -10 });

    const deltaX = logoRect.left - nameRect.left;
    const deltaY = logoRect.top - nameRect.top;
    const scaleRatio = logoRect.width / nameRect.width;

    const penStartY = isMobile ? 20 : 40;
    const penEndXPercent = isMobile ? -60 : -100;
    const penEndYPercent = isMobile ? -10 : -20;
    const penFlipX = isMobile ? 20 : isTablet ? 35 : 50;
    const penFlipY = isMobile ? 40 : 46;
    const penFlipScale = isMobile ? 0.35 : isTablet ? 0.42 : 0.5;
    const textExitX = isMobile ? 150 : 300;

    gsap.set(penElement, { yPercent: penStartY });
    gsap.set(footerElement, { opacity: 0, yPercent: 100 });
    gsap.set(welcomeElement, { opacity: 0, yPercent: 30 });
    gsap.set(nameElement, { opacity: 0, yPercent: 30 });
    gsap.set(galleryElement, { opacity: 0 });

    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      scrollTrigger: {
        trigger: "main",
        start: "top top",
        end: "+=3000",
        scrub: true,
        pin: true,
      },
    });

    tl.to(penElement, {
      rotate: 10,
      scale: 0.8,
      xPercent: penEndXPercent,
      yPercent: penEndYPercent,
      duration: 2,
    });
    tl.to(penTextElement, { xPercent: textExitX, duration: 2 }, "<");

    tl.to(welcomeElement, { opacity: 1, yPercent: 0, duration: 1 }, "-=0.5");
    tl.to(nameElement, { opacity: 1, yPercent: 0, duration: 1 }, "<+=0.3");

    tl.to(
      penElement,
      {
        rotate: 71,
        scale: penFlipScale,
        xPercent: penFlipX,
        yPercent: penFlipY,
        duration: 3,
      },
      "<-=0.8",
    );

    tl.to(welcomeElement, { opacity: 0, yPercent: -20, duration: 1 }, "<+=1");
    tl.to(
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

    tl.to(headerElement, { opacity: 1, duration: 0.5, yPercent: 0 }, "-=0.2");
    tl.to(nameElement, { opacity: 0, duration: 0.3 }, "<+=0.3");
    tl.to(footerElement, { opacity: 1, duration: 1, yPercent: 0 }, "<");
    tl.to(galleryElement, { opacity: 1, duration: 1 }, "<+=0.3");
  });

  return (
    <main className="flex flex-col bg-white h-dvh w-full overflow-hidden relative">
      <HeaderComponent headerRef={headerRef} headerLogoRef={headerLogoRef} />

      <HomeComponent
        penRef={penRef}
        penTextRef={penTextRef}
        welcomeTextRef={welcomeTextRef}
        nameTextRef={nameTextRef}
        galleryRef={galleryRef}
      />

      <FooterComponent footerRef={footerRef} />
    </main>
  );
};

export default Home;
