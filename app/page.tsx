"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { fakeArts } from "@/consts";
import { IArts } from "@/interfaces";

const generateStyles = (total: number): React.CSSProperties[] => {
  const cols = 8;
  const rows = Math.ceil(total / cols);
  return Array.from({ length: total }, (_, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const cellW = 100 / cols;
    const cellH = 100 / rows;
    const left = col * cellW + Math.random() * cellW * 0.4 - cellW * 0.05;
    const top = row * cellH + Math.random() * cellH * 0.4 - cellH * 0.05;
    const rotate = (Math.random() - 0.5) * 28;
    const width = 120 + Math.random() * 120;
    const height = 120 + Math.random() * 140;
    return {
      position: "absolute" as const,
      top: `${top}%`,
      left: `${left}%`,
      width,
      height,
      transform: `rotate(${rotate}deg)`,
    };
  });
};

const artStyles = generateStyles(fakeArts.length);

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
    tl.to(penTextElement, { xPercent: 300, duration: 2 }, "<");

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

      <section className="flex-1 min-h-0 w-full flex justify-center items-center relative">
        <Image
          ref={penRef}
          src="/images/pen.png"
          alt="pen"
          width={400}
          height={400}
          className="object-cover rotate-342 relative z-10"
        />
        <h5 ref={penTextRef} className="text-6xl relative z-10">
          SCROLL BITCH
        </h5>

        <div className="absolute left-1/2 top-1/2 -translate-y-1/2 pl-8 flex flex-col gap-2 z-10">
          <p ref={welcomeTextRef} className="text-6xl font-medium">
            WELCOME
          </p>
          <p ref={nameTextRef} className="text-5xl font-medium">
            GHAZAL SHAFIEI
          </p>
        </div>

        <div ref={galleryRef} className="absolute inset-x-0 top-4 bottom-28 overflow-hidden">
          {fakeArts.map((art: IArts, index: number) => (
            <div
              key={art.id}
              style={artStyles[index]}
              className="overflow-hidden"
            >
              <Image
                src={art.uri}
                alt={art.title}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </section>

      <footer
        ref={footerRef}
        className="bg-[#1E1E1E] flex justify-between items-center self-center px-3 py-4 gap-3 absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <button className="bg-black text-white p-2">YEARLY</button>
        <button className="bg-black text-white p-2">SERIES</button>
        <button className="bg-black text-white p-2">RANDOM</button>
        <button className="bg-black text-white p-2">RECENT</button>
      </footer>
    </main>
  );
};

export default Home;
