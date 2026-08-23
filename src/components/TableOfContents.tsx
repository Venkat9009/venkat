"use client";

import { useState, useEffect, useMemo } from "react";
import { slugifyHeading } from "@/lib/slugify";

interface TocEntry {
  id: string;
  text: string;
  level: number;
}

function extractHeadings(content: string): TocEntry[] {
  const headings: TocEntry[] = [];
  const seen = new Map<string, number>();
  const lines = content.split("\n");
  for (const line of lines) {
    const match = /^(#{1,3})\s+(.+)$/.exec(line);
    if (match) {
      const level = match[1].length;
      const text = match[2].replace(/[*_`~\[\]()]/g, "").trim();
      const base = slugifyHeading(text);
      const count = seen.get(base) || 0;
      seen.set(base, count + 1);
      const id = count === 0 ? base : `${base}-${count + 1}`;
      headings.push({ id, text, level });
    }
  }
  return headings;
}

export default function TableOfContents({ content }: { content: string }) {
  const [activeId, setActiveId] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const headings = useMemo(() => extractHeadings(content), [content]);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 }
    );

    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="toc-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle table of contents"
        style={{
          display: "none",
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          zIndex: 50,
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          background: "var(--text)",
          color: "var(--bg)",
          border: "none",
          cursor: "pointer",
          boxShadow: "var(--shadow-lg)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {isOpen ? (
            <path d="M18 6L6 18M6 6l12 12"/>
          ) : (
            <>
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </>
          )}
        </svg>
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.3)",
            zIndex: 40,
          }}
        />
      )}

      {/* TOC panel */}
      <nav
        className={`toc ${isOpen ? "toc-open" : ""}`}
        aria-label="Table of contents"
        style={{
          position: isOpen ? "fixed" : "sticky",
          top: isOpen ? "auto" : "100px",
          bottom: isOpen ? "0" : "auto",
          left: isOpen ? "0" : "auto",
          right: isOpen ? "0" : "auto",
          zIndex: isOpen ? 45 : 1,
          maxHeight: isOpen ? "60vh" : "calc(100vh - 140px)",
          overflowY: "auto",
          width: isOpen ? "100%" : "200px",
          background: isOpen ? "var(--bg-card)" : "transparent",
          borderRadius: isOpen ? "var(--radius) var(--radius) 0 0" : "var(--radius)",
          border: isOpen ? "1px solid var(--border)" : "none",
          padding: isOpen ? "1.5rem" : "0",
          boxShadow: isOpen ? "0 -4px 24px rgba(0,0,0,0.1)" : "none",
        }}
      >
        <h4
          style={{
            fontSize: "0.68rem",
            fontWeight: 600,
            letterSpacing: "0.1em",
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
            marginBottom: "0.75rem",
          }}
        >
          On this page
        </h4>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {headings.map((h) => (
            <li
              key={h.id}
              style={{
                marginLeft: `${(h.level - 1) * 0.75}rem`,
                marginBottom: "0.15rem",
              }}
            >
              <button
                onClick={() => handleClick(h.id)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "0.3rem 0.5rem",
                  borderRadius: "6px",
                  fontSize: h.level === 1 ? "0.82rem" : "0.76rem",
                  fontWeight: activeId === h.id ? 600 : 400,
                  color: activeId === h.id ? "var(--accent)" : "var(--text-tertiary)",
                  background: activeId === h.id ? "color-mix(in srgb, var(--accent) 8%, transparent)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  fontFamily: "inherit",
                  lineHeight: 1.4,
                }}
              >
                {h.text}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <style>{`
        @media (max-width: 1024px) {
          .toc { display: none !important; }
          .toc-toggle { display: flex !important; }
          .toc-open { display: block !important; }
          .article-toc-wrapper { display: none !important; }
        }
      `}</style>
    </>
  );
}
