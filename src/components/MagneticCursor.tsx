"use client";

import { useEffect, useRef } from "react";

const SELECTOR = "a, button, [data-cursor-magnetic], .card-hover, .pixel-card, .btn-primary, .btn-secondary, .theme-toggle, .nav-hamburger";
const BASE_SIZE = 18;
const HOVER_PAD = 8;

function isTouchDevice(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(hover: none)").matches || "ontouchstart" in window;
}

function getColors(): { base: string; hover: string } {
  const isDark = document.body.classList.contains("dark");
  return {
    base: isDark ? "rgba(255,255,255,0.55)" : "rgba(50,50,50,0.22)",
    hover: isDark ? "rgba(255,255,255,0.12)" : "rgba(50,50,50,0.08)",
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
    // GPU-accelerated: only use transform and opacity — no layout triggers
    cursor.style.cssText = `
      position:fixed;top:0;left:0;pointer-events:none;z-index:99999;
      will-change:transform,opacity;
      transform:translate3d(-100px,-100px,0);
      width:${BASE_SIZE}px;height:${BASE_SIZE}px;border-radius:50%;
      background:${c.base};opacity:0;
      transition:background 0.25s ease,border-radius 0.25s ease;
    `;
    document.body.appendChild(cursor);

    const mouse = { x: -100, y: -100 };
    // Interpolated (rendered) position — separate from target
    const renderPos = { x: -100, y: -100 };
    const renderSize = { w: BASE_SIZE, h: BASE_SIZE, r: BASE_SIZE / 2 };
    // Target values — what we interpolate toward
    const target = { x: -100, y: -100, w: BASE_SIZE, h: BASE_SIZE, r: BASE_SIZE / 2 };
    let isVisible = false;
    let isOnButton = false;
    let lastTime = performance.now();

    // --- helpers ---
    function lerp(a: number, b: number, t: number): number {
      return a + (b - a) * t;
    }

    function updateColors() {
      const colors = getColors();
      cursor.style.background = isOnButton ? colors.hover : colors.base;
    }

    function snapToElement(el: Element) {
      const rect = el.getBoundingClientRect();
      const cs = window.getComputedStyle(el);
      const baseR = parseFloat(cs.borderRadius) || 0;

      target.x = rect.left + rect.width / 2;
      target.y = rect.top + rect.height / 2;
      target.w = rect.width + HOVER_PAD;
      target.h = rect.height + HOVER_PAD;
      // Match element's border radius but cap it
      target.r = Math.min(baseR + 3, Math.min(rect.width, rect.height) / 2 + 3);
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

    // --- event handlers ---
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
      const target_el = (e.target as HTMLElement).closest(SELECTOR);
      if (!target_el) return;
      snapToElement(target_el);
    }

    function onMouseOut(e: MouseEvent) {
      const from = (e.target as HTMLElement).closest(SELECTOR);
      if (!from) return;
      const to = e.relatedTarget as HTMLElement | null;
      if (to && from.contains(to)) return;
      // Moving to a new interactive element — onMouseOver will handle it
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

    // --- RAF loop: interpolate position + size together ---
    function loop(now: number) {
      const dt = Math.min((now - lastTime) / 16.667, 3); // normalize to ~60fps, cap at 3x
      lastTime = now;

      // Spring-like easing: faster when far, slower when close
      // Speed factor: 0.14 for position, 0.16 for size (slightly faster for size to reduce alignment lag)
      const posSpeed = 0.14 * dt;
      const sizeSpeed = 0.16 * dt;

      renderPos.x = lerp(renderPos.x, target.x, posSpeed);
      renderPos.y = lerp(renderPos.y, target.y, posSpeed);
      renderSize.w = lerp(renderSize.w, target.w, sizeSpeed);
      renderSize.h = lerp(renderSize.h, target.h, sizeSpeed);
      renderSize.r = lerp(renderSize.r, target.r, sizeSpeed);

      // GPU-only render: translate3d + scale (no width/height changes = no layout)
      const hw = renderSize.w / 2;
      const hh = renderSize.h / 2;
      cursor.style.transform = `translate3d(${renderPos.x - hw}px,${renderPos.y - hh}px,0)`;
      cursor.style.width = `${renderSize.w}px`;
      cursor.style.height = `${renderSize.h}px`;
      cursor.style.borderRadius = `${renderSize.r}px`;

      rafRef.current = requestAnimationFrame(loop);
    }

    // --- attach ---
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
