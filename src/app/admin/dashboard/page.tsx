"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Article, SiteStats } from "@/types";
import ArticleEditor from "@/components/ArticleEditor";

export default function AdminDashboard() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"list" | "journal" | "article">("list");
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [journalDate, setJournalDate] = useState("");
  const [journalTime, setJournalTime] = useState("");
  const [journalContent, setJournalContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const router = useRouter();

  const loadArticles = useCallback(() => {
    fetch("/api/articles/admin")
      .then((r) => {
        if (r.status === 401) throw new Error("unauthorized");
        if (!r.ok) throw new Error("failed");
        return r.json();
      })
      .then((data) => {
        setArticles(data.articles || []);
        setLoading(false);
      })
      .catch((err) => {
        if (err.message === "unauthorized") {
          localStorage.removeItem("is_admin");
          router.push("/admin/login");
        } else {
          setLoading(false);
        }
      });
  }, [router]);

  useEffect(() => { loadArticles(); }, [loadArticles]);
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(""), 3000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  const stats: SiteStats = {
    totalArticles: articles.length,
    totalWords: articles.reduce((sum, a) => sum + (a.content?.split(/\s+/).length || 0), 0),
    totalReadingTime: articles.reduce((sum, a) => sum + (a.reading_time || Math.max(1, Math.ceil((a.content?.length || 0) / 1200))), 0),
    daysActive: new Set(articles.map((a) => new Date(a.createdAt).toDateString())).size,
    categories: [...new Set(articles.map((a) => a.category))],
  };

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      return data.url || null;
    } catch { return null; }
    finally { setUploading(false); }
  }, []);

  const handleJournalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file);
    if (url) setJournalContent((c) => c + `\n\n![image](${url})\n\n`);
    e.target.value = "";
  };

  const handleJournalSubmit = async () => {
    if (!journalContent.trim()) return;
    setSaving(true);
    try {
      const now = new Date();
      const dateStr = journalDate || now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
      const timeStr = journalTime || now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      const slug = dateStr.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "") + "-" + Date.now();
      const contentWithTime = `**${timeStr}**\n\n${journalContent.trim()}`;
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: dateStr,
          slug,
          content: contentWithTime,
          excerpt: journalContent.trim().split("\n")[0].slice(0, 120),
          category: "Journal",
          published: true,
        }),
      });
      if (res.ok) {
        setSuccessMsg("Journal entry saved!");
        setJournalDate("");
        setJournalTime("");
        setJournalContent("");
        setMode("list");
        loadArticles();
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleArticleSaved = () => {
    setSuccessMsg(editingArticle ? "Article updated!" : "Article saved!");
    setMode("list");
    setEditingArticle(null);
    loadArticles();
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setMode("article");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    const res = await fetch(`/api/articles?id=${id}`, { method: "DELETE" });
    if (res.ok) { setSuccessMsg("Deleted."); loadArticles(); }
  };

  const handleLogout = async () => {
    try { await fetch("/api/auth", { method: "DELETE" }); } catch { /* best-effort */ }
    localStorage.removeItem("is_admin");
    router.push("/admin/login");
  };

  const inputStyle = {
    padding: "0.6rem 0",
    border: "none",
    background: "transparent",
    color: "var(--text)",
    fontSize: "0.9rem",
    outline: "none",
    fontFamily: "'Playfair Display', Georgia, serif",
    borderBottom: "1px solid var(--border)",
    width: "100%",
  };

  return (
    <div style={{ padding: "2rem 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.75rem", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>Dashboard</h1>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {mode === "list" && (
            <>
              <button onClick={() => {
                const now = new Date();
                setJournalDate(now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }));
                setJournalTime(now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));
                setMode("journal");
              }} className="btn-secondary" style={{ fontSize: "0.82rem", padding: "0.6rem 1.25rem" }}>
                Journal
              </button>
              <button onClick={() => {
                setEditingArticle(null);
                setMode("article");
              }} className="btn-primary" style={{ fontSize: "0.82rem", padding: "0.6rem 1.25rem" }}>
                Write Article
              </button>
            </>
          )}
          {mode !== "list" && (
            <button onClick={() => { setMode("list"); setEditingArticle(null); }} className="btn-secondary" style={{ fontSize: "0.82rem", padding: "0.6rem 1.25rem" }}>
              Back
            </button>
          )}
          <button onClick={handleLogout} className="btn-secondary" style={{ fontSize: "0.82rem", padding: "0.6rem 1.25rem" }}>
            Logout
          </button>
        </div>
      </div>

      {successMsg && (
        <div style={{ padding: "0.75rem 1rem", borderRadius: "var(--radius-sm)", background: "var(--badge-green-bg)", color: "var(--badge-green-text)", fontSize: "0.85rem", fontWeight: 500, marginBottom: "1rem", animation: "fadeIn 0.3s ease" }}>
          {successMsg}
        </div>
      )}

      {/* Article Editor */}
      {mode === "article" && (
        <ArticleEditor article={editingArticle || undefined} onSaved={handleArticleSaved} onCancel={() => { setMode("list"); setEditingArticle(null); }} />
      )}

      {/* Journal Writer */}
      {mode === "journal" && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem", animation: "fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.25rem" }}>Journal Entry</h2>
          <div style={{ display: "flex", gap: "1rem" }}>
            <input type="text" placeholder="August 15, 2003" value={journalDate} onChange={(e) => setJournalDate(e.target.value)} style={{ ...inputStyle, flex: 2 }} />
            <input type="text" placeholder="3:45 PM" value={journalTime} onChange={(e) => setJournalTime(e.target.value)} style={{ ...inputStyle, flex: 1, color: "var(--text-tertiary)" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <label className="btn-secondary" style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem", cursor: "pointer" }}>
              {uploading ? "Uploading..." : "+ Image"}
              <input type="file" accept="image/*" onChange={handleJournalImageUpload} style={{ display: "none" }} />
            </label>
          </div>
          <textarea
            placeholder="Start writing..."
            value={journalContent}
            onChange={(e) => setJournalContent(e.target.value)}
            autoFocus
            rows={18}
            style={{ width: "100%", padding: "0", border: "none", background: "transparent", color: "var(--text)", fontSize: "1.05rem", lineHeight: 1.9, outline: "none", fontFamily: "'Playfair Display', Georgia, serif", resize: "none" }}
          />
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
            <button onClick={() => { setMode("list"); setJournalDate(""); setJournalTime(""); setJournalContent(""); }} className="btn-secondary" style={{ fontSize: "0.82rem", padding: "0.5rem 1rem" }}>Cancel</button>
            <button onClick={handleJournalSubmit} disabled={saving || !journalContent.trim()} className="btn-primary" style={{ fontSize: "0.82rem", padding: "0.5rem 1rem", opacity: saving || !journalContent.trim() ? 0.5 : 1 }}>
              {saving ? "Saving..." : "Publish"}
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      {mode === "list" && (
        <div className="stats-grid animate-in" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginBottom: "2rem" }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.25rem" }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Articles</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text)" }}>{stats.totalArticles}</div>
          </div>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.25rem" }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Words</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text)" }}>{stats.totalWords.toLocaleString()}</div>
          </div>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.25rem" }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Read Time</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text)" }}>{stats.totalReadingTime}m</div>
          </div>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.25rem" }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Days Active</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text)" }}>{stats.daysActive}</div>
          </div>
        </div>
      )}

      {/* Articles List */}
      {mode === "list" && (
        loading ? (
          <p style={{ color: "var(--text-tertiary)", fontSize: "0.9rem" }}>Loading...</p>
        ) : articles.length === 0 ? (
          <p style={{ color: "var(--text-tertiary)", fontSize: "0.9rem" }}>No entries yet. Click &quot;Write Article&quot; to start.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {articles.map((article) => (
              <div key={article.id} className="card-hover" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--bg-card)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0, flex: 1 }}>
                  {article.cover_image && (
                    <Image src={article.cover_image} alt="" width={40} height={40} style={{ borderRadius: "8px", objectFit: "cover", flexShrink: 0 }} />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{article.title}</h3>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", marginTop: "0.15rem", display: "flex", gap: "0.5rem" }}>
                      <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                      <span style={{ opacity: 0.4 }}>|</span>
                      <span style={{ color: article.published ? "var(--badge-green-text)" : "var(--badge-yellow-text)" }}>{article.published ? "Published" : "Draft"}</span>
                      <span style={{ opacity: 0.4 }}>|</span>
                      <span>{article.category}</span>
                      {article.view_count !== undefined && article.view_count > 0 && (
                        <>
                          <span style={{ opacity: 0.4 }}>|</span>
                          <span>{article.view_count} views</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0, marginLeft: "1rem" }}>
                  <button onClick={() => handleEdit(article)} className="btn-secondary" style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem" }}>Edit</button>
                  <Link href={`/blog/${article.slug}`} target="_blank" className="btn-secondary" style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem" }}>View</Link>
                  <button onClick={() => handleDelete(article.id)} style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem", borderRadius: "980px", border: "1px solid #fecaca", background: "transparent", color: "#ef4444", cursor: "pointer" }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
