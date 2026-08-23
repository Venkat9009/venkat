"use client";

import { useState, useEffect } from "react";

export default function ViewCounter({ slug }: { slug: string }) {
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    const seenKey = "viewed_articles";
    const seen: string[] = JSON.parse(sessionStorage.getItem(seenKey) || "[]");
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
          sessionStorage.setItem(seenKey, JSON.stringify([...seen, slug]));
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
