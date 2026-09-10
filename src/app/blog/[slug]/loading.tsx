export default function Loading() {
  return (
    <article style={{ maxWidth: "780px", margin: "0 auto", padding: "4rem 0 3rem" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "var(--text-tertiary)", fontSize: "0.82rem", fontWeight: 500, marginBottom: "2.5rem" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Back
      </div>

      <header style={{ display: "flex", gap: "2rem", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ width: "60px", height: "22px", borderRadius: "980px", background: "var(--bg-secondary)", marginBottom: "1rem", animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ width: "80%", height: "36px", borderRadius: "8px", background: "var(--bg-secondary)", marginBottom: "0.75rem", animation: "pulse 1.5s ease-in-out infinite 0.1s" }} />
          <div style={{ width: "50%", height: "36px", borderRadius: "8px", background: "var(--bg-secondary)", marginBottom: "1rem", animation: "pulse 1.5s ease-in-out infinite 0.2s" }} />
          <div style={{ width: "200px", height: "16px", borderRadius: "8px", background: "var(--bg-secondary)", animation: "pulse 1.5s ease-in-out infinite 0.3s" }} />
        </div>
      </header>

      <div style={{ borderTop: "1px solid var(--border)", marginBottom: "2.5rem" }} />

      <div style={{ display: "flex", gap: "3rem", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ marginBottom: "1.5rem" }}>
              <div style={{ width: `${90 - i * 10}%`, height: "14px", borderRadius: "8px", background: "var(--bg-secondary)", marginBottom: "0.5rem", animation: `pulse 1.5s ease-in-out infinite ${0.1 * i}s` }} />
              <div style={{ width: `${100 - i * 5}%`, height: "14px", borderRadius: "8px", background: "var(--bg-secondary)", animation: `pulse 1.5s ease-in-out infinite ${0.1 * i + 0.05}s` }} />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </article>
  );
}
