"use client";

import { useState, useEffect } from "react";

export default function LikeButton({ slug }: { slug: string }) {
  const [likes, setLikes] = useState<number | null>(null);
  const [liked, setLiked] = useState(() => {
    if (typeof window === "undefined") return false;
    const likedArticles = JSON.parse(localStorage.getItem("liked_articles") || "[]");
    return likedArticles.includes(slug);
  });

  useEffect(() => {
    fetch(`/api/articles/like?slug=${slug}`)
      .then((r) => r.json())
      .then((data) => setLikes(data.like_count ?? 0))
      .catch(() => setLikes(0));
  }, [slug]);

  const handleLike = async () => {
    try {
      const action = liked ? "unlike" : "like";
      const res = await fetch("/api/articles/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, action }),
      });
      const data = await res.json();
      setLikes(data.like_count ?? 0);
      setLiked(!liked);

      // Persist liked state in localStorage
      const likedArticles = JSON.parse(localStorage.getItem("liked_articles") || "[]");
      if (liked) {
        localStorage.setItem("liked_articles", JSON.stringify(likedArticles.filter((s: string) => s !== slug)));
      } else {
        likedArticles.push(slug);
        localStorage.setItem("liked_articles", JSON.stringify(likedArticles));
      }
    } catch { /* ignore */ }
  };

  if (likes === null) return null;

  return (
    <button
      onClick={handleLike}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        background: "none",
        border: "none",
        cursor: "pointer",
        color: liked ? "#ef4444" : "var(--text-tertiary)",
        fontSize: "0.8rem",
        fontWeight: 500,
        padding: "0.25rem 0.5rem",
        borderRadius: "6px",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = liked ? "1" : "0.8"; }}
      aria-label={liked ? "Unlike this article" : "Like this article"}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
      {likes.toLocaleString()}
    </button>
  );
}
