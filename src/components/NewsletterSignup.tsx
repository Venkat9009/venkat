"use client";

import { useState } from "react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("success");
        setMessage("You're subscribed! Check your inbox for a confirmation.");
        setEmail("");
      } else {
        const data = await res.json();
        setStatus("error");
        setMessage(data.error || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "2rem",
        textAlign: "center",
        marginTop: "2rem",
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "0.75rem" }}>
        <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
      </svg>
      <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.35rem" }}>
        Stay updated
      </h3>
      <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: 1.5 }}>
        Get notified when I publish new articles. No spam, unsubscribe anytime.
      </p>
      {status === "success" ? (
        <p style={{ fontSize: "0.85rem", color: "var(--badge-green-text)", fontWeight: 500 }}>{message}</p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem", maxWidth: "380px", margin: "0 auto" }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            style={{
              flex: 1,
              padding: "0.6rem 0.85rem",
              borderRadius: "10px",
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--text)",
              fontSize: "0.85rem",
              outline: "none",
              fontFamily: "inherit",
            }}
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="btn-primary"
            style={{ padding: "0.6rem 1.25rem", fontSize: "0.82rem", opacity: status === "loading" ? 0.6 : 1 }}
          >
            {status === "loading" ? "..." : "Subscribe"}
          </button>
        </form>
      )}
      {status === "error" && (
        <p style={{ fontSize: "0.8rem", color: "#ef4444", marginTop: "0.5rem" }}>{message}</p>
      )}
    </div>
  );
}
