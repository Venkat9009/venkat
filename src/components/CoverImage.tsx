"use client";

import { useState } from "react";
import Image from "next/image";
import ImageLightbox from "./ImageLightbox";

export default function CoverImage({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        style={{
          flexShrink: 0,
          width: "280px",
          height: "200px",
          borderRadius: "var(--radius)",
          overflow: "hidden",
          position: "relative",
          cursor: "zoom-in",
        }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="280px"
          style={{ objectFit: "cover" }}
        />
      </div>
      {open && <ImageLightbox src={src} alt={alt} onClose={() => setOpen(false)} />}
    </>
  );
}
