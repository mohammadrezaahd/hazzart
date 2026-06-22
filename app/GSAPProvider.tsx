// GSAPProvider.tsx
"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { Flip } from "gsap/Flip";

// 👇 module-level، نه داخل useEffect
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, Flip);

export default function GSAPProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
