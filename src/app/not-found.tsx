import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ padding: "6rem 0", textAlign: "center", maxWidth: "480px", margin: "0 auto" }}>
      <div className="animate-in">
        <div style={{ fontSize: "4rem", fontWeight: 800, color: "var(--text)", fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1, marginBottom: "0.5rem" }}>
          404
        </div>
        <h1
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: "0.75rem",
          }}
        >
          Page not found
        </h1>
        <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "2rem" }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>

      <div className="animate-in animate-in-delay-1" style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center" }}>
        <Link href="/" className="btn-primary" style={{ padding: "0.65rem 1.5rem" }}>
          Go Home
        </Link>
        <Link href="/blog" className="btn-secondary" style={{ padding: "0.65rem 1.5rem" }}>
          Browse Articles
        </Link>
        <Link href="/journal" className="btn-secondary" style={{ padding: "0.65rem 1.5rem" }}>
          Read Journal
        </Link>
      </div>

      <div className="animate-in animate-in-delay-2" style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid var(--border)" }}>
        <p style={{ fontSize: "0.82rem", color: "var(--text-tertiary)", marginBottom: "0.75rem" }}>
          Or try searching:
        </p>
        <form
          action="/blog"
          method="GET"
          style={{ maxWidth: "300px", margin: "0 auto" }}
        >
          <div style={{ position: "relative" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              name="q"
              placeholder="Search articles..."
              style={{
                width: "100%",
                padding: "0.6rem 0.85rem 0.6rem 2.5rem",
                borderRadius: "980px",
                border: "1px solid var(--border)",
                background: "var(--bg-card)",
                color: "var(--text)",
                fontSize: "0.85rem",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
