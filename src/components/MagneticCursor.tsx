"use client";

import { useEffect, useRef } from "react";

const SELECTOR = "a, button, [data-cursor-magnetic], .card-hover, .pixel-card, .btn-primary, .btn-secondary, .theme-toggle, .nav-hamburger";
const MAX_SIZE = 120;

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

    // Fixed-size element — only transform changes (pure GPU compositing)
    // No width/height/borderRadius changes = zero layout triggers
    cursor.style.cssText = `
      position:fixed;top:0;left:0;pointer-events:none;z-index:99999;
      will-change:transform,opacity;
      transform:translate3d(-100px,-100px,0) scale(1);
      width:${MAX_SIZE}px;height:${MAX_SIZE}px;border-radius:50%;
      background:${c.base};opacity:0;
      transition:background 0.25s ease;
    `;
    document.body.appendChild(cursor);

    const mouse = { x: -100, y: -100 };
    const renderPos = { x: -100, y: -100 };
    const target = { x: -100, y: -100, scale: 1 };
    let isVisible = false;
    let isOnButton = false;
    let lastTime = performance.now();
    let currentRenderScale = 1;

    function lerp(a: number, b: number, t: number): number {
      return a + (b - a) * t;
    }

    function updateColors() {
      const colors = getColors();
      cursor.style.background = isOnButton ? colors.hover : colors.base;
    }

    function snapToElement(el: Element) {
      const rect = el.getBoundingClientRect();
      // Calculate scale so MAX_SIZE circle covers the element
      const maxDim = Math.max(rect.width, rect.height) + 8;
      const scale = Math.min(maxDim / MAX_SIZE, 2.5);
      target.x = rect.left + rect.width / 2;
      target.y = rect.top + rect.height / 2;
      target.scale = scale;
      isOnButton = true;
      updateColors();
    }

    function resetToDefault() {
      target.x = mouse.x;
      target.y = mouse.y;
      target.scale = 1;
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

    // RAF loop — only updates transform (GPU-composited) and opacity
    // No width, height, borderRadius = no layout on any hardware
    function loop(now: number) {
      const dt = Math.min((now - lastTime) / 16.667, 3);
      lastTime = now;

      const posSpeed = 0.14 * dt;
      const scaleSpeed = 0.18 * dt;

      renderPos.x = lerp(renderPos.x, target.x, posSpeed);
      renderPos.y = lerp(renderPos.y, target.y, posSpeed);
      currentRenderScale = lerp(currentRenderScale, target.scale, scaleSpeed);

      // Pure GPU: translate3d + scale — compositor-only, zero layout
      const half = (MAX_SIZE * currentRenderScale) / 2;
      cursor.style.transform = `translate3d(${renderPos.x - half}px,${renderPos.y - half}px,0) scale(${currentRenderScale})`;

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
