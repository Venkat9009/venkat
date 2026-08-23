"use client";

import Link from "next/link";
import type { Article } from "@/types";

interface SeriesBadgeProps {
  series: string;
  currentSlug: string;
  articles?: Article[];
}

export default function SeriesBadge({ series, currentSlug, articles = [] }: SeriesBadgeProps) {
  const currentIndex = articles.findIndex((a) => a.slug === currentSlug);
  const total = articles.length;

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "1rem 1.25rem",
        marginBottom: "1.5rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
        </svg>
        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--accent)" }}>
          Series: {series}
        </span>
        {total > 0 && (
          <span style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>
            {currentIndex >= 0 ? `Part ${currentIndex + 1} of ${total}` : `${total} articles`}
          </span>
        )}
      </div>
      {articles.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginTop: "0.5rem" }}>
          {articles.map((article, i) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.35rem 0.5rem",
                borderRadius: "8px",
                fontSize: "0.78rem",
                fontWeight: article.slug === currentSlug ? 600 : 400,
                color: article.slug === currentSlug ? "var(--text)" : "var(--text-secondary)",
                background: article.slug === currentSlug ? "color-mix(in srgb, var(--accent) 8%, transparent)" : "transparent",
                transition: "all 0.15s ease",
              }}
            >
              <span style={{ width: "18px", height: "18px", borderRadius: "50%", background: article.slug === currentSlug ? "var(--accent)" : "var(--bg-secondary)", color: article.slug === currentSlug ? "#fff" : "var(--text-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 600, flexShrink: 0 }}>
                {i + 1}
              </span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {article.title}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
