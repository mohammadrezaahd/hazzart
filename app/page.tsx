"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";

const Home = () => {
  const penRef = useRef<HTMLImageElement>(null);

  useGSAP(() => {
    if (!penRef.current) return;

    const penElement = penRef.current;

    gsap.set(penElement, { yPercent: 45 });

    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      scrollTrigger: {
        trigger: ".opening",
        start: "top top",
        end: "+=2000",
        scrub: true,
        pin: true,
      },
    });

    tl.to(penElement, {
      rotate: 0,
      scale: 0.5,
      xPercent: -100,
      yPercent: -45,
    });
  });

  return (
    <>
      <main className="flex flex-col bg-white h-screen w-full opacity-0">
        <header className="flex justify-between items-center w-full shrink-0 px-6 py-4">
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

        <section className="flex-1 min-h-0 w-full"></section>

        <footer className="bg-[#1E1E1E] flex justify-between items-center self-center shrink-0 px-3 py-4 gap-3">
          <button className="bg-black text-white p-2">YEARLY</button>
          <button className="bg-black text-white p-2">SERIES</button>
          <button className="bg-black text-white p-2">RANDOM</button>
          <button className="bg-black text-white p-2">RECENT</button>
        </footer>
      </main>
      <div className="opening h-screen w-screen absolute top-0 left-0 flex justify-center items-center">
        <Image
          ref={penRef}
          src="/images/pen.png"
          alt="pen"
          width={400}
          height={400}
          className="object-cover rotate-342"
        />
        <h5>SCROLL BITCH</h5>
      </div>
    </>
  );
};

export default Home;
