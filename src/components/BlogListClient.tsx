"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { ArticleListItem } from "@/types";
import ArticleCard from "@/components/ArticleCard";

const PAGE_SIZE = 6;

function FilterBtn({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}

      style={{
        padding: "0.45rem 1.1rem",
        borderRadius: "980px",
        border: "1px solid var(--border)",
        background: isActive ? "var(--text)" : "transparent",
        color: isActive ? "var(--bg)" : "var(--text-secondary)",
        fontSize: "0.8rem",
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.2s ease",
        fontFamily: "inherit",
      }}
    >
      {label}
    </button>
  );
}

interface BlogListClientProps {
  initialArticles: ArticleListItem[];
  initialCategories: string[];
}

export default function BlogListClient({ initialArticles, initialCategories }: BlogListClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const articles = initialArticles;
  const categories = initialCategories;
  const [activeCategory, setActiveCategory] = useState(searchParams.get("cat") || "all");
  const [activeTag, setActiveTag] = useState<string | null>(searchParams.get("tag"));
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [page, setPage] = useState(Math.max(1, parseInt(searchParams.get("page") || "1", 10)));
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, []);

  const updateURL = (params: Record<string, string | null>) => {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === "" || value === "all" || (key === "page" && value === "1")) {
        sp.delete(key);
      } else {
        sp.set(key, value);
      }
    }
    const qs = sp.toString();
    router.replace(qs ? `/blog?${qs}` : "/blog", { scroll: false });
  };

  const updateSearchURLDebounced = (value: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      updateURL({ q: value || null, page: "1" });
    }, 300);
  };

  // "/" keyboard shortcut to focus search
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) return;
        e.preventDefault();
        document.querySelector<HTMLInputElement>('[aria-label="Search articles"]')?.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    articles.forEach((a) => (a.tags || []).forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [articles]);

  const filtered = useMemo(() => articles.filter((a) => {
    const matchesCategory = activeCategory === "all" || a.category === activeCategory;
    const matchesTag = !activeTag || (a.tags || []).includes(activeTag);
    const matchesSearch =
      searchQuery === "" ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.tags || []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesTag && matchesSearch;
  }), [articles, activeCategory, activeTag, searchQuery]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = page < totalPages;

  return (
    <>
      <div className="animate-in animate-in-delay-1" style={{ marginBottom: "1.5rem" }}>
        <div style={{ position: "relative" }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-tertiary)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              position: "absolute",
              left: "1rem",
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search articles... (press /)"
            aria-label="Search articles"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); updateSearchURLDebounced(e.target.value); }}
            style={{
              width: "100%",
              padding: "0.75rem 1rem 0.75rem 2.75rem",
              borderRadius: "980px",
              border: "1px solid var(--border)",
              background: "var(--bg-card)",
              color: "var(--text)",
              fontSize: "0.9rem",
              outline: "none",
              fontFamily: "inherit",
              transition: "border-color 0.2s ease, box-shadow 0.2s ease",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); setPage(1); updateURL({ q: null, page: "1" }); }}
              aria-label="Clear search"
              style={{
                position: "absolute",
                right: "0.75rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-tertiary)",
                padding: "4px",
                display: "flex",
                fontSize: "1.1rem",
                lineHeight: 1,
              }}
            >
              x
            </button>
          )}
        </div>
      </div>

      <div
        className="animate-in animate-in-delay-1"
        style={{
          display: "flex",
          gap: "0.4rem",
          flexWrap: "wrap",
          padding: "0 0 1.5rem",
          borderBottom: "1px solid var(--border)",
          marginBottom: "2rem",
        }}
      >
        <FilterBtn label="all" isActive={activeCategory === "all"} onClick={() => { setActiveCategory("all"); setPage(1); updateURL({ cat: null, page: "1" }); }} />
        {categories.map((cat) => (
          <FilterBtn key={cat} label={cat} isActive={activeCategory === cat} onClick={() => { setActiveCategory(cat); setPage(1); updateURL({ cat, page: "1" }); }} />
        ))}
      </div>

      {allTags.length > 0 && (
        <div
          className="animate-in animate-in-delay-2"
          style={{
            display: "flex",
            gap: "0.35rem",
            flexWrap: "wrap",
            padding: "0 0 1.25rem",
            marginBottom: "1.5rem",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <span style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", fontWeight: 500, alignSelf: "center", marginRight: "0.25rem" }}>
            Tags:
          </span>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => { const next = activeTag === tag ? null : tag; setActiveTag(next); setPage(1); updateURL({ tag: next, page: "1" }); }}
              style={{
                padding: "0.3rem 0.7rem",
                borderRadius: "980px",
                border: "1px solid var(--border)",
                background: activeTag === tag ? "var(--text)" : "transparent",
                color: activeTag === tag ? "var(--bg)" : "var(--text-tertiary)",
                fontSize: "0.72rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontFamily: "inherit",
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ padding: "4rem 0", textAlign: "center", color: "var(--text-tertiary)" }}>
          <p style={{ fontSize: "0.9rem" }}>
            {searchQuery ? `No articles found for "${searchQuery}"` : "No articles found."}
          </p>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))",
              gap: "1rem",
            }}
          >
            {paginated.map((article, i) => (
              <ArticleCard key={article.id} article={article} index={i} />
            ))}
          </div>
          {hasMore && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}>
              <button
                onClick={() => { setPage((p) => p + 1); updateURL({ page: String(page + 1) }); }}
                className="btn-secondary"
          
                style={{ padding: "0.6rem 2rem" }}
              >
                Load More
                <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginLeft: "0.4rem" }}>
                  ({filtered.length - paginated.length} remaining)
                </span>
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
