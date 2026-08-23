"use client";

import { useEffect, useRef } from "react";

const SELECTOR = "a, button, [data-cursor-magnetic], .card-hover, .pixel-card, .btn-primary, .btn-secondary, .theme-toggle, .nav-hamburger";
const BASE_SIZE = 22;

function isTouchDevice(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(hover: none)").matches || "ontouchstart" in window;
}

function getColors(): { base: string; hover: string } {
  const isDark = document.body.classList.contains("dark");
  return {
    base: isDark ? "rgba(255,255,255,0.6)" : "rgba(50,50,50,0.25)",
    hover: isDark ? "rgba(255,255,255,0.15)" : "rgba(50,50,50,0.10)",
  };
}

export default function MagneticCursor() {
  const rafRef = useRef<number>(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (isTouchDevice()) return;

    const cursor = document.createElement("div");
    cursor.setAttribute("aria-hidden", "true");
    const c = getColors();

    cursor.style.cssText = `
      position:fixed;top:0;left:0;pointer-events:none;z-index:99999;
      will-change:transform,opacity;
      transform:translate3d(-100px,-100px,0);
      width:${BASE_SIZE}px;height:${BASE_SIZE}px;border-radius:50%;
      background:${c.base};opacity:0;
    `;
    document.body.appendChild(cursor);

    const mouse = { x: -100, y: -100 };
    const pos = { x: -100, y: -100 };
    const target = { x: -100, y: -100, w: BASE_SIZE, h: BASE_SIZE, r: BASE_SIZE / 2 };
    let isVisible = false;
    let isOnButton = false;
    let lastTime = performance.now();

    function lerp(a: number, b: number, t: number): number {
      return a + (b - a) * t;
    }

    function updateColors() {
      const colors = getColors();
      cursor.style.background = isOnButton ? colors.hover : colors.base;
    }

    function snapToElement(el: Element) {
      const rect = el.getBoundingClientRect();
      const pad = 8;
      target.x = rect.left + rect.width / 2;
      target.y = rect.top + rect.height / 2;
      target.w = rect.width + pad;
      target.h = rect.height + pad;
      target.r = 12;
      isOnButton = true;
      updateColors();
    }

    function resetToDefault() {
      target.x = mouse.x;
      target.y = mouse.y;
      target.w = BASE_SIZE;
      target.h = BASE_SIZE;
      target.r = BASE_SIZE / 2;
      isOnButton = false;
      updateColors();
    }

    function onMouseMove(e: MouseEvent) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (!isOnButton) {
        target.x = mouse.x;
        target.y = mouse.y;
      }
      if (!isVisible) {
        isVisible = true;
        cursor.style.opacity = "1";
      }
    }

    function onMouseOver(e: MouseEvent) {
      const el = (e.target as HTMLElement).closest(SELECTOR);
      if (!el) return;
      snapToElement(el);
    }

    function onMouseOut(e: MouseEvent) {
      const from = (e.target as HTMLElement).closest(SELECTOR);
      if (!from) return;
      const to = e.relatedTarget as HTMLElement | null;
      if (to && from.contains(to)) return;
      if (to && to.closest(SELECTOR)) return;
      resetToDefault();
    }

    function onMouseLeave() {
      isVisible = false;
      cursor.style.opacity = "0";
    }

    function onMouseEnter() {
      isVisible = true;
      cursor.style.opacity = "1";
    }

    function loop(now: number) {
      const dt = Math.min((now - lastTime) / 16.667, 3);
      lastTime = now;

      const speed = isOnButton ? 0.16 : 0.2;
      pos.x = lerp(pos.x, target.x, speed * dt);
      pos.y = lerp(pos.y, target.y, speed * dt);

      // GPU-only: width/height change is fine because element is position:fixed
      // and only moves via transform. The size change triggers paint but not layout.
      const cw = lerp(cursor.offsetWidth || BASE_SIZE, target.w, 0.15 * dt);
      const ch = lerp(cursor.offsetHeight || BASE_SIZE, target.h, 0.15 * dt);

      cursor.style.transform = `translate3d(${pos.x - cw / 2}px,${pos.y - ch / 2}px,0)`;
      cursor.style.width = `${cw}px`;
      cursor.style.height = `${ch}px`;
      cursor.style.borderRadius = `${target.r}px`;

      rafRef.current = requestAnimationFrame(loop);
    }

    document.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseover", onMouseOver, { passive: true });
    document.addEventListener("mouseout", onMouseOut, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave, { passive: true });
    document.addEventListener("mouseenter", onMouseEnter, { passive: true });
    document.body.style.cursor = "none";
    lastTime = performance.now();
    rafRef.current = requestAnimationFrame(loop);

    cleanupRef.current = () => {
      cancelAnimationFrame(rafRef.current);
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
