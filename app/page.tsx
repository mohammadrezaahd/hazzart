"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";

const Home = () => {
  const penRef = useRef<HTMLImageElement>(null);
  const penTextRef = useRef<HTMLHeadingElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (
      !penRef.current ||
      !headerRef.current ||
      !footerRef.current ||
      !penTextRef.current
    )
      return;

    const penElement = penRef.current;
    const penTextElement = penTextRef.current;
    const headerElement = headerRef.current;
    const footerElement = footerRef.current;

    gsap.set(penElement, { yPercent: 40 });
    gsap.set(headerElement, { opacity: 0, yPercent: -10 });
    gsap.set(footerElement, { opacity: 0, yPercent: 0 });

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
      yPercent: -30,
    });

    tl.to(penTextElement, { xPercent: 300 }, "<");

    tl.to(penElement, { rotate: 71, scale: 0.5, xPercent: 50, yPercent: 47 });

    tl.to(headerElement, { opacity: 100, duration: 1, yPercent: 0 }, "<+=0.3");
    tl.to(footerElement, { opacity: 100, duration: 1, yPercent: -65 }, "<");
  });

  return (
    <main className="flex flex-col bg-white h-screen w-full">
      <header
        ref={headerRef}
        className="flex justify-between items-center w-full shrink-0 px-6 py-4"
      >
        <div className="logo font-bold text-4xl">GHAZAL SHAFIEI</div>
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

      <section className="flex-1 min-h-0 w-full flex justify-center items-center">
        <Image
          ref={penRef}
          src="/images/pen.png"
          alt="pen"
          width={400}
          height={400}
          className="object-cover rotate-342"
        />
        <h5 ref={penTextRef} className="text-6xl">
          SCROLL BITCH
        </h5>
      </section>

      <footer
        ref={footerRef}
        className="bg-[#1E1E1E] flex justify-between items-center self-center shrink-0 px-3 py-4 gap-3"
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
