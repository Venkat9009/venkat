import Link from "next/link";

interface RelatedArticle {
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  createdAt: string;
}

export default function RelatedArticles({ articles }: { articles: RelatedArticle[] }) {
  if (articles.length === 0) return null;

  return (
    <div style={{ marginTop: "3rem" }}>
      <h3 style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: "1.25rem",
        fontWeight: 700,
        color: "var(--text)",
        letterSpacing: "-0.01em",
        marginBottom: "1rem",
      }}>
        Continue Reading
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {articles.map((article) => (
          <Link
            key={article.slug}
            href={`/blog/${article.slug}`}
            className="card-hover"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "1rem 1.25rem",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              background: "var(--bg-card)",
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                <span className="tag">{article.category}</span>
              </div>
              <h4 style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--text)" }}>
                {article.title}
              </h4>
              <p style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", marginTop: "0.15rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {article.excerpt}
              </p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginLeft: "1rem", opacity: 0.4 }}>
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
