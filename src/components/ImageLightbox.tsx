"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface ImageLightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export default function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  // Remember *which* src failed so opening another image resets the state
  // without a setState-in-effect.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = failedSrc !== null && failedSrc === src;
  // Portal target: the lightbox only ever opens via a click (client-side),
  // so document exists on first render — no effect needed (and SSR never
  // renders this component since it starts closed).
  const [portalTarget] = useState<HTMLElement | null>(
    () => (typeof document === "undefined" ? null : document.body)
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    // Lenis (smooth scroll) keeps driving scroll with its own rAF loop and
    // ignores body overflow — stop it while the lightbox is open so the
    // page behind can't move.
    window.__lenis?.stop();
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
      window.__lenis?.start();
    };
  }, [onClose]);

  // Portal straight to <body>: the lightbox is opened from inside animated
  // containers (PageTransition will-change/transform, .animate-in fill-mode)
  // that create their own stacking contexts — without a portal the article
  // text can paint above the overlay (background text showing through).
  // Render nothing until mounted to stay SSR-safe.
  if (!portalTarget) return null;

  return createPortal(
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      className="image-lightbox"
      aria-label={alt || "Image preview"}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        // Light backdrop (follows the site theme, so white in light mode):
        // the top and bottom chrome sit on a clean surface so text reads
        // nicely instead of floating over darkness.
        background: "color-mix(in srgb, var(--bg) 96%, transparent)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        cursor: "zoom-out",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          background: "color-mix(in srgb, var(--text) 8%, transparent)",
          border: "1px solid var(--border)",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "var(--text)",
          fontSize: "1.2rem",
        }}
      >
        ×
      </button>
      {failed ? (
        <p style={{ color: "var(--text)", fontSize: "0.9rem" }}>
          Could not load this image.
        </p>
      ) : (
        <figure
          style={{
            margin: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.9rem",
            maxWidth: "90vw",
            maxHeight: "90vh",
          }}
        >
          {/* Plain <img> on purpose: next/image throws "Invalid src prop" for
              hosts outside remotePatterns, which broke the lightbox entirely
              for externally-pasted image URLs. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            onError={() => setFailedSrc(src)}
            style={{
              maxWidth: "90vw",
              maxHeight: alt ? "78vh" : "90vh",
              borderRadius: "12px",
              objectFit: "contain",
              animation: "scaleIn 0.2s ease",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-lg)",
              background: "var(--bg-card)",
            }}
          />
          {alt && (
            <figcaption
              style={{
                maxWidth: "640px",
                textAlign: "center",
                fontSize: "0.85rem",
                lineHeight: 1.5,
                color: "var(--text-secondary)",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "980px",
                padding: "0.45rem 1.1rem",
              }}
            >
              {alt}
            </figcaption>
          )}
        </figure>
      )}
    </div>,
    portalTarget
  );
}
