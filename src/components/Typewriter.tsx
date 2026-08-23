"use client";

import { useState, useEffect } from "react";

const roles = ["Venkat..", "Student :)", "Developer..."];
const ROLE_SPEED = 100;
const ERASE_SPEED = 60;
const PAUSE_MS = 1500;

export default function Typewriter() {
  const [roleIdx, setRoleIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [erasing, setErasing] = useState(false);

  useEffect(() => {
    const current = roles[roleIdx];
    let timer: ReturnType<typeof setTimeout>;

    if (!erasing && charIdx < current.length) {
      timer = setTimeout(() => setCharIdx((c) => c + 1), ROLE_SPEED);
    } else if (!erasing && charIdx === current.length) {
      timer = setTimeout(() => setErasing(true), PAUSE_MS);
    } else if (erasing && charIdx > 0) {
      timer = setTimeout(() => setCharIdx((c) => c - 1), ERASE_SPEED);
    } else if (erasing && charIdx === 0) {
      timer = setTimeout(() => {
        setErasing(false);
        setRoleIdx((r) => (r + 1) % roles.length);
      }, 0);
    }

    return () => clearTimeout(timer);
  }, [charIdx, erasing, roleIdx]);

  const displayText = roles[roleIdx].slice(0, charIdx);

  return (
    <span>
      {displayText}
      <span style={{ borderRight: "2px solid var(--text)", marginLeft: "2px", animation: "blink 0.8s step-end infinite" }} />
    </span>
  );
}
