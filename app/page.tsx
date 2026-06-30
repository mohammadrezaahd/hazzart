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

    gsap.set(headerElement, { opacity: 1, yPercent: 0 });
    const nameRect = nameElement.getBoundingClientRect();
    const logoRect = headerLogoElement.getBoundingClientRect();
    gsap.set(headerElement, { opacity: 0, yPercent: -10 });

    const deltaX = logoRect.left - nameRect.left;
    const deltaY = logoRect.top - nameRect.top;
    const scaleRatio = logoRect.width / nameRect.width;

    gsap.set(penElement, { yPercent: 40 });
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
      xPercent: -100,
      yPercent: -20,
      duration: 2,
    });
    tl.to(penTextElement, { xPercent: 300, duration: 2 });

    tl.to(welcomeElement, { opacity: 1, yPercent: 0, duration: 1 }, "-=0.5");
    tl.to(nameElement, { opacity: 1, yPercent: 0, duration: 1 }, "<+=0.3");

    tl.to(
      penElement,
      { rotate: 71, scale: 0.5, xPercent: 50, yPercent: 46, duration: 3 },
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
    <main className="flex flex-col bg-white h-screen w-full overflow-hidden relative">
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
