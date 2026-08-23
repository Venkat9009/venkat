import Link from "next/link";
import type { Article } from "@/types";
import PixelCard from "@/components/PixelCard";
import CalendarHeatmap from "@/components/CalendarHeatmap";
import Typewriter from "@/components/Typewriter";
import { getArticles } from "@/lib/data";

export const revalidate = 300;

const skills = {
  Languages: ["JavaScript", "TypeScript", "Python", "SQL", "HTML/CSS"],
  Frameworks: ["Next.js", "React"],
  Tools: ["Git", "Supabase", "GitHub", "VS Code"],
};

const highlights = [
  { label: "Internship", value: "Frontend Developer — Prompt 2 Prod AI", period: "Feb 28 – Jun 14, 2026" },
  { label: "Education", value: "B.Tech Data Science", period: "JNTUH" },
  { label: "Projects", value: "Full-Stack Web Apps", period: "Next.js + Supabase" },
];

export default async function HomePage() {
  let articles: Article[] = [];
  try {
    articles = await getArticles(true);
  } catch {
    articles = [];
  }

  const variants = ["default", "blue", "yellow", "pink"] as const;

  return (
    <>
      {/* Hero */}
      <section
        className="home-grid animate-in"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 400px",
          gap: "3rem",
          alignItems: "center",
          padding: "4rem 0 2rem",
        }}
      >
        <div className="hero-section">
          <div
            className="animate-in animate-in-delay-1"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1.25rem",
            }}
          >
            <div className="status-dot" />
            <span style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", fontWeight: 500 }}>
              Open to opportunities
            </span>
          </div>

          <h1
            className="animate-in animate-in-delay-2"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(2.8rem, 5vw, 4rem)",
              fontWeight: 700,
              color: "var(--text)",
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              marginBottom: "1rem",
            }}
          >
            I&apos;m{" "}
            <span>
              <Typewriter />
            </span>
          </h1>

          <p
            className="animate-in animate-in-delay-3"
            style={{
              fontSize: "1.05rem",
              color: "var(--text-secondary)",
              lineHeight: 1.7,
              maxWidth: "480px",
              marginBottom: "1.5rem",
            }}
          >
            I&apos;m a Frontend Developer and Data Science student who
            loves building real products. From concept to deployment —
            I ship fast, clean, and user-focused web applications.
          </p>

          <div
            className="animate-in animate-in-delay-4"
            style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "2rem" }}
          >
            <Link href="/about" className="btn-primary">
              View Full Profile
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
            <a
              href="https://github.com/venkatanarayanareddyp2pai-ops"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </a>
          </div>
        </div>

        {/* Profile Card */}
        <div
          className="animate-in animate-in-delay-3"
          style={{
            background: "var(--bg-card)",
            borderRadius: "20px",
            padding: "3rem 2.5rem",
            textAlign: "center",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div
            style={{
              width: "110px",
              height: "110px",
              borderRadius: "50%",
              margin: "0 auto 1.5rem",
              overflow: "hidden",
              background: "linear-gradient(135deg, #007aff, #5856d6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/profile.jpg"
              alt="Venkat"
              className="profile-avatar"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.25rem", letterSpacing: "-0.01em" }}>
            N.Venkata Narayana Reddy
          </h2>
          <p style={{ fontSize: "0.72rem", fontWeight: 500, letterSpacing: "0.15em", color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: "1.5rem" }}>
            Data Science Student
          </p>

          {highlights.map((h, i) => (
            <div key={h.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 0", borderTop: "1px solid var(--border)" }}>
              <div style={{ textAlign: "left" }}>
                <p style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>{h.label}</p>
                <p style={{ fontSize: i === 0 ? "1rem" : "0.9rem", color: "var(--text)", fontWeight: i === 0 ? 700 : 600 }}>{h.value}</p>
              </div>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>{h.period}</span>
            </div>
          ))}

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.25rem", borderTop: "1px solid var(--border)", paddingTop: "1.25rem" }}>
            <a
              href="/resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ flex: 1, justifyContent: "center", padding: "0.55rem 1rem", fontSize: "0.8rem" }}
            >
              Resume
            </a>
            <Link
              href="/blog"
              className="btn-secondary"
              style={{ flex: 1, justifyContent: "center", padding: "0.55rem 1rem", fontSize: "0.8rem" }}
            >
              Read Blogs
            </Link>
          </div>
        </div>
      </section>

      <div style={{ borderTop: "1px solid var(--border)" }} />

      {/* Skills */}
      <section style={{ padding: "3rem 0" }}>
        <h2 className="animate-in" style={{ fontSize: "1.5rem", fontWeight: 650, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: "1.5rem" }}>
          Technical Skills
        </h2>
        <div className="skills-grid animate-in animate-in-delay-1" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
          {Object.entries(skills).map(([category, items]) => (
            <div
              key={category}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "1.25rem",
              }}
            >
              <h3 style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: "0.6rem" }}>
                {category}
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                {items.map((item) => (
                  <span
                    key={item}
                    style={{
                      padding: "0.25rem 0.6rem",
                      borderRadius: "980px",
                      background: "color-mix(in srgb, var(--text) 8%, transparent)",
                      color: "var(--text-secondary)",
                      fontSize: "0.78rem",
                      fontWeight: 500,
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ borderTop: "1px solid var(--border)" }} />

      {/* Writing Activity */}
      <section style={{ padding: "3rem 0 1rem" }}>
        <div className="animate-in" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 650, color: "var(--text)", letterSpacing: "-0.02em" }}>
            Writing Activity
          </h2>
          <span style={{ fontSize: "0.78rem", color: "var(--text-tertiary)" }}>
            {articles.length} {articles.length === 1 ? "article" : "articles"} published
          </span>
        </div>
        <div
          className="animate-in animate-in-delay-1"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "1.5rem",
            boxShadow: "var(--shadow-sm)",
            overflowX: "auto",
          }}
        >
          <CalendarHeatmap articles={articles} />
        </div>
      </section>

      {/* Latest Writing */}
      <section style={{ padding: "3rem 0" }}>
        <div className="animate-in animate-in-delay-5" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 650, color: "var(--text)", letterSpacing: "-0.02em" }}>
            Latest Writing
          </h2>
          {articles.length > 0 && (
            <Link
              href="/blog"
              className="link-muted"
            >
              View all
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          )}
        </div>

        {articles.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 2rem", color: "var(--text-tertiary)" }}>
            <p style={{ fontSize: "0.9rem" }}>No articles published yet.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {articles.slice(0, 6).map((article, i) => {
              const variant = variants[i % variants.length];
              return (
                <Link
                  key={article.id}
                  href={`/blog/${article.slug}`}
                  style={{ textDecoration: "none", color: "inherit", animation: `fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${0.1 * i}s both` }}
                >
                  <PixelCard variant={variant} reveal className="article-card" pixelText={article.title}>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", zIndex: 1 }}>
                      {article.cover_image && (
                        <img src={article.cover_image} alt="" crossOrigin="anonymous" aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
                      )}
                      <div style={{ position: "absolute", inset: 0, background: article.cover_image ? "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.7) 100%)" : "none", borderRadius: "inherit" }} />
                      <span className="tag" style={{ position: "absolute", top: "1.25rem", left: "1.25rem", zIndex: 2 }}>
                        {article.category}
                      </span>
                      <div style={{ position: "relative", zIndex: 2, padding: "1.5rem" }}>
                        <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: article.cover_image ? "#fff" : "var(--text)", letterSpacing: "-0.01em", marginBottom: "0.3rem", lineHeight: 1.3 }}>
                          {article.title}
                        </h3>
                        {!article.cover_image && (
                          <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", marginBottom: "0.5rem" } as React.CSSProperties}>
                            {article.excerpt}
                          </p>
                        )}
                        <span style={{ fontSize: "0.72rem", color: article.cover_image ? "rgba(255,255,255,0.65)" : "var(--text-tertiary)" }}>
                          {new Date(article.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>
                  </PixelCard>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
