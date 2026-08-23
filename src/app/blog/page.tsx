import type { Metadata } from "next";
import { Suspense } from "react";
import BlogListClient from "@/components/BlogListClient";
import { getArticles, getCategories } from "@/lib/data";

export const metadata: Metadata = {
  title: "Articles — Venkat",
  description: "Thoughts on development, design, and the things I'm learning along the way.",
};

export const revalidate = 300;

export default async function BlogPage() {
  let articles: Awaited<ReturnType<typeof getArticles>> = [];
  let categories: string[] = [];
  try {
    [articles, categories] = await Promise.all([
      getArticles(true),
      getCategories(),
    ]);
  } catch {
    // Graceful degradation: show an empty list instead of crashing the page.
  }

  return (
    <>
      <section className="animate-in" style={{ padding: "4rem 0 1rem" }}>
        <h1
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
            fontWeight: 700,
            color: "var(--text)",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            marginBottom: "0.75rem",
          }}
        >
          Articles
        </h1>
        <p
          style={{
            fontSize: "1.05rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            maxWidth: "480px",
          }}
        >
          Thoughts on development, design, and the things I&apos;m learning along the way.
        </p>
      </section>

      <Suspense fallback={<div style={{ padding: "2rem 0", textAlign: "center", color: "var(--text-tertiary)" }}>Loading articles...</div>}>
        <BlogListClient initialArticles={articles} initialCategories={categories} />
      </Suspense>
    </>
  );
}
