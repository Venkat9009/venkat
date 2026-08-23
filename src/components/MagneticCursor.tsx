"use client";

import { useEffect, useRef } from "react";

const SELECTOR = "a, button, [data-cursor-magnetic], .card-hover, .pixel-card, .btn-primary, .btn-secondary, .theme-toggle, .nav-hamburger";

function isTouchDevice(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(hover: none)").matches || "ontouchstart" in window;
}

function getColors(): { base: string; hover: string } {
  const isDark = document.body.classList.contains("dark");
  return {
    base: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.25)",
    hover: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)",
  };
}

export default function MagneticCursor() {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (isTouchDevice()) return;

    const cursor = document.createElement("div");
    cursor.setAttribute("aria-hidden", "true");
    const c = getColors();

    // Fixed 22px dot — only transform changes (GPU), CSS handles hover scale
    cursor.style.cssText = `
      position:fixed;top:0;left:0;
      width:22px;height:22px;margin:-11px 0 0 -11px;
      border-radius:50%;
      pointer-events:none;
      z-index:99999;
      will-change:transform;
      transform:translate3d(-100px,-100px,0);
      background:${c.base};
      opacity:0;
      transition:transform 0.15s ease-out, width 0.25s ease, height 0.25s ease, margin 0.25s ease, background 0.2s ease, opacity 0.15s ease;
    `;
    document.body.appendChild(cursor);

    let mouseX = -100;
    let mouseY = -100;
    let curX = -100;
    let curY = -100;
    let raf: number;
    let hovered = false;

    function onMouseMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursor.style.opacity = "1";
    }

    function onMouseOver(e: MouseEvent) {
      const el = (e.target as HTMLElement).closest(SELECTOR);
      if (!el || hovered) return;
      hovered = true;

      const rect = el.getBoundingClientRect();
      const pad = 10;
      const w = rect.width + pad;
      const h = rect.height + pad;
      const colors = getColors();

      cursor.style.width = `${w}px`;
      cursor.style.height = `${h}px`;
      cursor.style.margin = `${-h / 2}px 0 0 ${-w / 2}px`;
      cursor.style.borderRadius = "12px";
      cursor.style.background = colors.hover;

      // Snap position to element center immediately
      mouseX = rect.left + rect.width / 2;
      mouseY = rect.top + rect.height / 2;
    }

    function onMouseOut(e: MouseEvent) {
      const from = (e.target as HTMLElement).closest(SELECTOR);
      if (!from) return;
      const to = e.relatedTarget as HTMLElement | null;
      if (to && from.contains(to)) return;
      if (to && to.closest(SELECTOR)) return;

      hovered = false;
      const colors = getColors();

      cursor.style.width = "22px";
      cursor.style.height = "22px";
      cursor.style.margin = "-11px 0 0 -11px";
      cursor.style.borderRadius = "50%";
      cursor.style.background = colors.base;
    }

    function onMouseLeave() {
      cursor.style.opacity = "0";
    }

    function onMouseEnter() {
      cursor.style.opacity = "1";
    }

    // RAF loop — ONLY updates translate3d position. Nothing else.
    function loop() {
      curX += (mouseX - curX) * 0.18;
      curY += (mouseY - curY) * 0.18;
      cursor.style.transform = `translate3d(${curX}px,${curY}px,0)`;
      raf = requestAnimationFrame(loop);
    }

    document.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseover", onMouseOver, { passive: true });
    document.addEventListener("mouseout", onMouseOut, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave, { passive: true });
    document.addEventListener("mouseenter", onMouseEnter, { passive: true });
    document.body.style.cursor = "none";
    raf = requestAnimationFrame(loop);

    cleanupRef.current = () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("mouseout", onMouseOut);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      document.body.style.cursor = "";
      cursor.remove();
    };

    return () => cleanupRef.current?.();
  }, []);

  return null;
}
