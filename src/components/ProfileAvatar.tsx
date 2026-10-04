"use client";

import { useState } from "react";

// Profile photo with graceful fallback: if /profile.jpg is missing,
// show gradient + initials instead of a broken-image icon.
// Server pages (app/page.tsx) can import this client island directly.
export default function ProfileAvatar() {
  const [failed, setFailed] = useState(false);

  return (
    <div
      style={{
        width: "110px",
        height: "110px",
        borderRadius: "50%",
        margin: "0 auto 1.5rem",
        overflow: "hidden",
        background: "linear-gradient(135deg, #007aff, #5856d6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: "2rem",
        fontWeight: 700,
      }}
      aria-label="Venkat profile photo"
      role="img"
    >
      {failed ? (
        <span aria-hidden>V</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/profile.jpg"
          alt="Venkat"
          className="profile-avatar"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
