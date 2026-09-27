"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const rafRef = useRef<number>(0);
  const pathname = usePathname();
  const isFirstLoad = useRef(true);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia("(hover: none)").matches || "ontouchstart" in window;

    if (reducedMotion) {
      window.__lenis = undefined;
      return;
    }

    const lenis = new Lenis({
      duration: isMobile ? 1.0 : 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: isMobile ? 2 : 1.5,
      infinite: false,
    });

    window.__lenis = lenis;

    function raf(time: number) {
      lenis.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    }

    rafRef.current = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafRef.current);
      lenis.destroy();
      window.__lenis = undefined;
    };
  }, []);

  // Next.js scrolls window to top on navigation, but Lenis owns the scroll
  // position and swallows it — so article clicks kept the old offset.
  // Reset through Lenis (instant, before the enter animation) on every
  // pathname change. Query-only changes (blog filters) keep the pathname,
  // so they correctly stay put.
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    const lenis = window.__lenis;
    if (lenis) {
      lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return <>{children}</>;
}
