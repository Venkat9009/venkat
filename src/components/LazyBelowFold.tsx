"use client";

import { lazy, Suspense } from "react";
import type { Article } from "@/types";

const TableOfContents = lazy(() => import("@/components/TableOfContents"));
const RelatedArticles = lazy(() => import("@/components/RelatedArticles"));
const SeriesBadge = lazy(() => import("@/components/SeriesBadge"));
const NewsletterSignup = lazy(() => import("@/components/NewsletterSignup"));
const ViewCounter = lazy(() => import("@/components/ViewCounter"));
const LikeButton = lazy(() => import("@/components/LikeButton"));

function Fallback() {
  return <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", color: "var(--text-tertiary)" }}>&hellip;</span>;
}

export function LazyTableOfContents({ content }: { content: string }) {
  return <Suspense fallback={<Fallback />}><TableOfContents content={content} /></Suspense>;
}

export function LazyRelatedArticles({ articles }: { articles: Article[] }) {
  return <Suspense fallback={null}><RelatedArticles articles={articles} /></Suspense>;
}

export function LazySeriesBadge({ series, currentSlug, articles }: { series: string; currentSlug: string; articles: Article[] }) {
  return <Suspense fallback={null}><SeriesBadge series={series} currentSlug={currentSlug} articles={articles} /></Suspense>;
}

export function LazyNewsletterSignup() {
  return <Suspense fallback={null}><NewsletterSignup /></Suspense>;
}

export function LazyViewCounter({ slug }: { slug: string }) {
  return <Suspense fallback={<Fallback />}><ViewCounter slug={slug} /></Suspense>;
}

export function LazyLikeButton({ slug }: { slug: string }) {
  return <Suspense fallback={<Fallback />}><LikeButton slug={slug} /></Suspense>;
}
