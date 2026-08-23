"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (res.ok) {
        // Non-secret UI flag only — actual auth lives in the httpOnly
        // cookie the server just set, which is sent automatically on
        // same-origin requests.
        localStorage.setItem("is_admin", "1");
        router.push("/admin/dashboard");
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "4rem 0", maxWidth: "400px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--text)" }}>Admin</h1>
      <p style={{ color: "var(--text-tertiary)", fontSize: "0.9rem", marginBottom: "2rem" }}>Sign in to manage articles</p>

      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label htmlFor="admin-username" style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", marginBottom: "0.3rem", display: "block" }}>Username</label>
          <input
            id="admin-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            style={{
              width: "100%",
              padding: "0.65rem 0.85rem",
              borderRadius: "10px",
              border: "1px solid var(--border)",
              background: "var(--bg-card)",
              color: "var(--text)",
              fontSize: "0.9rem",
              outline: "none",
            }}
          />
        </div>
        <div>
          <label htmlFor="admin-password" style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", marginBottom: "0.3rem", display: "block" }}>Password</label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{
              width: "100%",
              padding: "0.65rem 0.85rem",
              borderRadius: "10px",
              border: "1px solid var(--border)",
              background: "var(--bg-card)",
              color: "var(--text)",
              fontSize: "0.9rem",
              outline: "none",
            }}
          />
        </div>
        {error && <p style={{ color: "#ef4444", fontSize: "0.85rem" }}>{error}</p>}
        <button type="submit" disabled={loading} style={{
          padding: "0.7rem",
          borderRadius: "10px",
          border: "none",
          background: "var(--text)",
          color: "var(--bg)",
          fontSize: "0.9rem",
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.6 : 1,
        }}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
