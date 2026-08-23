"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const isMobile = window.matchMedia("(hover: none)").matches || "ontouchstart" in window;

    const lenis = new Lenis({
      duration: isMobile ? 0.6 : 0.8,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: !isMobile,
      touchMultiplier: isMobile ? 2 : 1.5,
    });

    // Prevent stuck scroll on iPhone: reset scroll position on orientation change
    const onOrientationChange = () => {
      lenis.scrollTo(0, { immediate: true, force: true });
    };

    // Prevent body scroll when Lenis is handling it on mobile
    const preventBodyScroll = (e: TouchEvent) => {
      // Allow scrolling inside modals/menus that have their own scroll
      const target = e.target as HTMLElement;
      if (target.closest('.nav-mobile-menu, [data-lenis-prevent]')) return;
    };

    if (isMobile) {
      document.body.style.overflow = "hidden";
      window.addEventListener("orientationchange", onOrientationChange);
      document.addEventListener("touchmove", preventBodyScroll, { passive: true });
    }

    function raf(time: number) {
      lenis.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    }

    rafRef.current = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafRef.current);
      lenis.destroy();
      if (isMobile) {
        document.body.style.overflow = "";
        window.removeEventListener("orientationchange", onOrientationChange);
        document.removeEventListener("touchmove", preventBodyScroll);
      }
    };
  }, []);

  return <>{children}</>;
}
