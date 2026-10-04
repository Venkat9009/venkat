import Link from "next/link";
import Image from "next/image";
import { formatDateLong, formatDateShort } from "@/lib/format";
import type { ArticleListItem } from "@/types";

interface ArticleCardProps {
  article: ArticleListItem;
  index?: number;
  compactDate?: boolean;
}

export default function ArticleCard({ article, index = 0, compactDate = false }: ArticleCardProps) {
  const hasCover = !!article.cover_image;
  const issueNo = String((index % 99) + 1).padStart(2, "0");

  return (
    <Link
      href={`/blog/${article.slug}`}
      aria-label={`Read: ${article.title}`}
      style={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
        animation: `fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.05 * (index % 6)}s both`,
      }}
    >
      <div className="article-card article-card-plain">
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            zIndex: 1,
          }}
        >
          {hasCover && (
            <Image
              src={article.cover_image as string}
              alt=""
              aria-hidden
              fill
              loading="lazy"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="article-card-img"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "inherit",
              }}
            />
          )}
          {hasCover && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.7) 100%)",
                borderRadius: "inherit",
              }}
            />
          )}
          <span className="tag" style={{ position: "absolute", top: "1.25rem", left: "1.25rem", zIndex: 2 }}>
            {article.category}
          </span>
          {!hasCover && (
            <span
              aria-hidden
              style={{
                position: "absolute",
                top: "1.25rem",
                right: "1.25rem",
                zIndex: 2,
                fontSize: "0.72rem",
                fontWeight: 600,
                letterSpacing: "0.12em",
                color: "var(--text-tertiary)",
                opacity: 0.7,
              }}
            >
              {issueNo}
            </span>
          )}
          <div style={{ position: "relative", zIndex: 2, padding: "1.5rem" }}>
            <h2
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                color: hasCover ? "#fff" : "var(--text)",
                letterSpacing: "-0.01em",
                marginBottom: "0.35rem",
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              } as React.CSSProperties}
            >
              {article.title}
            </h2>
            {!hasCover && (
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.4,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  marginBottom: "0.5rem",
                } as React.CSSProperties}
              >
                {article.excerpt}
              </p>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.72rem", color: hasCover ? "rgba(255,255,255,0.65)" : "var(--text-tertiary)" }}>
                {compactDate ? formatDateShort(article.createdAt) : formatDateLong(article.createdAt)}
              </span>
              {article.view_count !== undefined && article.view_count > 0 && (
                <span style={{ fontSize: "0.68rem", color: hasCover ? "rgba(255,255,255,0.5)" : "var(--text-tertiary)", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                  {article.view_count}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
