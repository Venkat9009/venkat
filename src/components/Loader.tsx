"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export default function Loader() {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => {
    clearTimers();
    timersRef.current.push(setTimeout(() => setPhase("hold"), 300));
    timersRef.current.push(setTimeout(() => setPhase("out"), 900));
    timersRef.current.push(setTimeout(() => setVisible(false), 1300));
    return clearTimers;
  }, [clearTimers]);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg)",
      opacity: phase === "out" ? 0 : 1,
      transition: "opacity 0.4s ease",
      pointerEvents: phase === "out" ? "none" : "all",
    }}>
      <div style={{
        opacity: phase === "in" ? 0 : 1,
        transform: phase === "in" ? "scale(0.96)" : "scale(1)",
        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: "clamp(2.5rem, 8vw, 5rem)",
        fontWeight: 700,
        color: "var(--text)",
        letterSpacing: "-0.02em",
      }}>
        venkat.
      </div>
    </div>
  );
}
