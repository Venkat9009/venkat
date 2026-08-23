"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";

function isTouchDevice(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(hover: none)").matches || "ontouchstart" in window;
}

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const rafRef = useRef<number>(0);

  useEffect(() => {
    // Disable Lenis on mobile — native scroll is smoother and touch gestures conflict
    if (isTouchDevice()) return;

    const lenis = new Lenis({
      duration: 0.8,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });

    function raf(time: number) {
      lenis.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    }

    rafRef.current = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafRef.current);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
