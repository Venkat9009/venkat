"use client";

import { useState, useEffect, useRef } from "react";

function readSeen(): string[] {
  try {
    const raw = sessionStorage.getItem("viewed_articles");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export default function ViewCounter({ slug }: { slug: string }) {
  const [views, setViews] = useState<number | null>(null);
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;
    const seen = readSeen();
    const alreadyCounted = seen.includes(slug);

    const request = alreadyCounted
      ? fetch(`/api/articles/view?slug=${encodeURIComponent(slug)}`)
      : fetch("/api/articles/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        });

    request
      .then((r) => r.json())
      .then((data) => {
        setViews(data.view_count ?? 0);
        if (!alreadyCounted) {
          try {
            sessionStorage.setItem("viewed_articles", JSON.stringify([...seen, slug]));
          } catch { /* ignore */ }
        }
      })
      .catch(() => setViews(0));
  }, [slug]);

  if (views === null) return null;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
      </svg>
      {views.toLocaleString()} views
    </span>
  );
}
