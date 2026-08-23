import Link from "next/link";
import CoverImage from "@/components/CoverImage";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { getArticleBySlug, getArticleById, getRelatedArticles } from "@/lib/data";
import { checkAuthFromCookie, SESSION_COOKIE } from "@/lib/auth";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import ReadingProgressBar from "@/components/ReadingProgressBar";
import ShareButtons from "@/components/ShareButtons";
import BackToTop from "@/components/BackToTop";
import TableOfContents from "@/components/TableOfContents";
import RelatedArticles from "@/components/RelatedArticles";
import ViewCounter from "@/components/ViewCounter";
import LikeButton from "@/components/LikeButton";
import SeriesBadge from "@/components/SeriesBadge";
import NewsletterSignup from "@/components/NewsletterSignup";
import { getSiteUrl } from "@/lib/config";
import { getSeriesArticles } from "@/lib/data";

const SITE_URL = getSiteUrl();

async function getViewableArticle(slug: string) {
  let article = await getArticleBySlug(slug);
  if (!article) article = await getArticleById(slug);
  if (!article) return null;

  if (!article.published) {
    const cookieStore = await cookies();
    const isAdmin = checkAuthFromCookie(cookieStore.get(SESSION_COOKIE)?.value);
    if (!isAdmin) return null;
  }

  return article;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getViewableArticle(slug);
  if (!article) return { title: "Article Not Found" };
  return {
    title: `${article.title} — Venkat`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      url: `${SITE_URL}/blog/${article.slug}`,
      publishedTime: article.createdAt,
      modifiedTime: article.updatedAt,
      ...(article.cover_image && { images: [{ url: article.cover_image, width: 1200, height: 630 }] }),
    },
  };
}

function ReadingMeta({ article }: { article: { reading_time?: number; content?: string; word_count?: number; slug: string; createdAt: string } }) {
  const readTime = article.reading_time || Math.max(1, Math.ceil((article.content?.length || 0) / 1200));
  const wordCount = article.word_count || (article.content?.split(/\s+/).length || 0);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        flexWrap: "wrap",
        fontSize: "0.82rem",
        color: "var(--text-secondary)",
      }}
    >
      <time>
        {new Date(article.createdAt).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </time>
      <span style={{ opacity: 0.4 }}>·</span>
      <span>{readTime} min read</span>
      {wordCount > 0 && (
        <>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>{wordCount.toLocaleString()} words</span>
        </>
      )}
      <span style={{ opacity: 0.4 }}>·</span>
      <ViewCounter slug={article.slug} />
      <LikeButton slug={article.slug} />
    </div>
  );
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getViewableArticle(slug);

  if (!article) {
    return (
      <div style={{ padding: "6rem 0", textAlign: "center" }}>
        <h1
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "2rem",
            fontWeight: 700,
            marginBottom: "1rem",
            color: "var(--text)",
          }}
        >
          Article not found
        </h1>
        <Link href="/blog" className="btn-secondary">Back to articles</Link>
      </div>
    );
  }

  const wordCount = article.word_count || (article.content?.split(/\s+/).length || 0);
  const related = await getRelatedArticles(article.slug, article.category, 3);
  const seriesArticles = article.series ? await getSeriesArticles(article.series, article.slug) : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.createdAt,
    dateModified: article.updatedAt,
    author: { "@type": "Person", name: "Venkata Narayana Reddy", url: `${SITE_URL}/about` },
    publisher: { "@type": "Person", name: "Venkata Narayana Reddy" },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/${article.slug}` },
    ...(article.cover_image && { image: article.cover_image }),
    wordCount,
    articleSection: article.category,
  };

  return (
    <>
      <ReadingProgressBar />
      <BackToTop />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article style={{ maxWidth: "780px", margin: "0 auto", padding: "4rem 0 3rem" }}>
        <Link
          href="/blog"
          className="animate-in"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            color: "var(--text-tertiary)",
            fontSize: "0.82rem",
            fontWeight: 500,
            marginBottom: "2.5rem",
            transition: "color 0.3s ease",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </Link>

        <header className="animate-in animate-in-delay-1" style={{ display: "flex", gap: "2rem", alignItems: "flex-start", marginBottom: "2rem" }}>
          {article.cover_image && (
            <CoverImage src={article.cover_image} alt={article.title} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <span className="tag" style={{ marginBottom: "1rem", display: "inline-block" }}>{article.category}</span>
            <h1
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "clamp(2rem, 4vw, 2.75rem)",
                fontWeight: 700,
                color: "var(--text)",
                lineHeight: 1.15,
                letterSpacing: "-0.025em",
                marginTop: "0.5rem",
                marginBottom: "1rem",
              }}
            >
              {article.title}
            </h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <ReadingMeta article={article} />
              <ShareButtons title={article.title} slug={article.slug} />
            </div>
          </div>
        </header>

        <div style={{ borderTop: "1px solid var(--border)", marginBottom: "2.5rem" }} />

        {article.series && seriesArticles.length > 0 && (
          <SeriesBadge series={article.series} currentSlug={article.slug} articles={seriesArticles} />
        )}

        <div style={{ display: "flex", gap: "3rem", alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="animate-in animate-in-delay-2">
              <MarkdownRenderer content={article.content} />
            </div>
          </div>
          <div className="article-toc-wrapper">
            <TableOfContents content={article.content} />
          </div>
        </div>

        {related.length > 0 && (
          <div className="animate-in animate-in-delay-3">
            <RelatedArticles articles={related} />
          </div>
        )}

        <NewsletterSignup />

        <div style={{ borderTop: "1px solid var(--border)", margin: "3.5rem 0 2rem" }} />

        <div
          className="animate-in animate-in-delay-3"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "2rem",
          }}
        >
          <Link href="/blog" className="btn-secondary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            All Articles
          </Link>
          <ShareButtons title={article.title} slug={article.slug} />
        </div>
      </article>
    </>
  );
}
