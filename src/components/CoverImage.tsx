"use client";

import { useState } from "react";
import Image from "next/image";
import ImageLightbox from "./ImageLightbox";

// Hosts next/image can optimize (mirrors remotePatterns in next.config.js).
function isOptimizable(src: string): boolean {
  if (src.startsWith("/") || src.startsWith("data:") || src.startsWith("blob:")) return true;
  try {
    const url = new URL(src);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function CoverImage({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <>
      <div
        className="cover-image"
        onClick={() => { if (!failed) setOpen(true); }}        onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !failed) setOpen(true); }}
        role="button"
        tabIndex={0}
        aria-label={`Enlarge cover image: ${alt}`}
        style={{
          flexShrink: 0,
          width: "100%",
          maxWidth: "280px",
          aspectRatio: "7 / 5",
          borderRadius: "var(--radius)",
          overflow: "hidden",
          position: "relative",
          cursor: failed ? "default" : "zoom-in",
          background: "var(--bg-secondary)",
        }}
      >
        {failed ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-tertiary)", fontSize: "0.8rem" }}>
            Image unavailable
          </div>
        ) : isOptimizable(src) ? (
          <Image
            src={src}
            alt={alt}
            fill
            priority
            sizes="(max-width: 640px) 100vw, 280px"
            style={{ objectFit: "contain", objectPosition: "center" }}
            onError={() => setFailed(true)}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            onError={() => setFailed(true)}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", objectPosition: "center" }}
          />
        )}
      </div>
      {open && !failed && <ImageLightbox src={src} alt={alt} onClose={() => setOpen(false)} />}
    </>
  );
}
