"use client";

import { useState, useRef } from "react";
import type { Article } from "@/types";

interface ArticleEditorProps {
  article?: Article;
  onSaved: () => void;
  onCancel: () => void;
}

export default function ArticleEditor({ article, onSaved, onCancel }: ArticleEditorProps) {
  const [title, setTitle] = useState(article?.title || "");
  const [slug, setSlug] = useState(article?.slug || "");
  const [content, setContent] = useState(article?.content || "");
  const [excerpt, setExcerpt] = useState(article?.excerpt || "");
  const [category, setCategory] = useState(article?.category || "");
  const [tags, setTags] = useState(article?.tags?.join(", ") || "");
  const [mood, setMood] = useState(article?.mood || "");
  const [series, setSeries] = useState(article?.series || "");
  const [published, setPublished] = useState(article?.published ?? false);
  const [coverImage, setCoverImage] = useState(article?.cover_image || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const contentImageRef = useRef<HTMLInputElement>(null);

  const isEditing = !!article;

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+$/, "")
      .slice(0, 80);
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!isEditing && (!slug || slug === generateSlug(title))) {
      setSlug(generateSlug(value));
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      return data.url || null;
    } catch {
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file);
    if (url) setCoverImage(url);
    e.target.value = "";
  };

  const handleContentImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file);
    if (url) {
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const before = content.slice(0, start);
        const after = content.slice(end);
        setContent(before + `\n\n![image](${url})\n\n` + after);
      } else {
        setContent((c) => c + `\n\n![image](${url})\n\n`);
      }
    }
    e.target.value = "";
  };

  const handleSubmit = async () => {
    if (!title.trim() || !slug.trim() || !content.trim() || !category.trim()) {
      setError("Title, slug, content, and category are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const body = {
        title: title.trim(),
        slug: slug.trim(),
        content: content.trim(),
        excerpt: excerpt.trim() || content.trim().slice(0, 200),
        category: category.trim(),
        published,
        cover_image: coverImage || undefined,
        tags: tagList.length > 0 ? tagList : undefined,
        mood: mood || undefined,
        series: series || undefined,
      };

      const url = isEditing ? `/api/articles?slug=${article.slug}` : "/api/articles";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        onSaved();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save article.");
      }
    } catch {
      setError("Something went wrong.");
    }
    setSaving(false);
  };

  const inputStyle = {
    width: "100%",
    padding: "0.6rem 0.85rem",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    background: "var(--bg-card)",
    color: "var(--text)",
    fontSize: "0.9rem",
    outline: "none",
    fontFamily: "inherit",
  };

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        animation: "fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.25rem" }}>
        {isEditing ? "Edit Article" : "Write Article"}
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "0.75rem" }}>
        <div>
          <label style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "0.25rem", display: "block" }}>Title</label>
          <input type="text" value={title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="My new article" style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "0.25rem", display: "block" }}>Slug</label>
          <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-new-article" style={inputStyle} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.75rem" }}>
        <div>
          <label style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "0.25rem", display: "block" }}>Category</label>
          <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="tech, tutorial, etc." style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "0.25rem", display: "block" }}>Tags (comma-separated)</label>
          <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="react, nextjs, css" style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "0.25rem", display: "block" }}>Series (optional)</label>
          <input type="text" value={series} onChange={(e) => setSeries(e.target.value)} placeholder="e.g. React Fundamentals" style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "0.25rem", display: "block" }}>Mood</label>
          <input type="text" value={mood} onChange={(e) => setMood(e.target.value)} placeholder="happy, focused, etc." style={inputStyle} />
        </div>
      </div>

      <div>
        <label style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "0.25rem", display: "block" }}>Excerpt (optional)</label>
        <input type="text" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Brief summary of the article..." style={inputStyle} />
      </div>

      {/* Cover Image */}
      <div>
        <label style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "0.25rem", display: "block" }}>Cover Image</label>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button type="button" onClick={() => coverInputRef.current?.click()} className="btn-secondary" style={{ fontSize: "0.78rem", padding: "0.5rem 1rem", flexShrink: 0 }}>
            {uploading ? "Uploading..." : coverImage ? "Change Image" : "+ Cover Image"}
          </button>
          <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverUpload} style={{ display: "none" }} />
          {coverImage && (
            <div style={{ position: "relative", width: "80px", height: "50px", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverImage} alt="Cover preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button
                onClick={() => setCoverImage("")}
                style={{ position: "absolute", top: "2px", right: "2px", width: "18px", height: "18px", borderRadius: "50%", background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", cursor: "pointer", fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                x
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content Image Upload */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button type="button" onClick={() => contentImageRef.current?.click()} className="btn-secondary" style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem" }}>
          {uploading ? "Uploading..." : "+ Insert Image"}
        </button>
        <input ref={contentImageRef} type="file" accept="image/*" onChange={handleContentImageUpload} style={{ display: "none" }} />
      </div>

      {/* Markdown Content */}
      <div>
        <label style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "0.25rem", display: "block" }}>Content (Markdown)</label>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your article in markdown..."
          rows={20}
          style={{
            width: "100%",
            padding: "1rem",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            background: "var(--bg)",
            color: "var(--text)",
            fontSize: "0.95rem",
            lineHeight: 1.7,
            outline: "none",
            fontFamily: "monospace",
            resize: "vertical",
          }}
        />
      </div>

      {/* Publish toggle */}
      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          style={{ width: "16px", height: "16px", accentColor: "var(--accent)" }}
        />
        Publish immediately (uncheck for draft)
      </label>

      {error && <p style={{ color: "#ef4444", fontSize: "0.85rem" }}>{error}</p>}

      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
        <button onClick={onCancel} className="btn-secondary" style={{ fontSize: "0.82rem", padding: "0.5rem 1rem" }}>
          Cancel
        </button>
        <button onClick={handleSubmit} disabled={saving || !title.trim() || !content.trim()} className="btn-primary" style={{ fontSize: "0.82rem", padding: "0.5rem 1rem", opacity: saving || !title.trim() || !content.trim() ? 0.5 : 1 }}>
          {saving ? "Saving..." : published ? "Publish" : "Save Draft"}
        </button>
      </div>
    </div>
  );
}
