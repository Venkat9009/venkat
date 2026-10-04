import { ImageResponse } from "next/og";
import { getSiteUrl } from "@/lib/config";

export const runtime = "nodejs";
export const contentType = "image/png";

function clampParam(value: string | null, fallback: string, max: number): string {
  const v = (value || fallback).trim();
  const base = v || fallback;
  return base.length > max ? base.slice(0, max - 1) + "…" : base;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // Truncate: unbounded ?title= overflowed 1200x630 and enabled
    // cache-busting DoS. No visual change for normal titles.
    const title = clampParam(searchParams.get("title"), "Venkat — Developer & Writer", 120);
    const subtitle = clampParam(searchParams.get("subtitle"), "", 200);
    const category = clampParam(searchParams.get("category"), "", 30);
    let host = "venkat.dev";
    try {
      host = new URL(getSiteUrl()).host;
    } catch {
      // keep fallback
    }

    return new ImageResponse(
      (
        <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: "linear-gradient(135deg, #000 0%, #1a1a2e 50%, #16213e 100%)",
          padding: "60px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "60px",
            left: "60px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #007aff, #5856d6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "20px",
              fontWeight: "bold",
            }}
          >
            V
          </div>
          <span style={{ color: "#a1a1a6", fontSize: "22px", fontWeight: 500 }}>
            venkat.
          </span>
        </div>

        {category && (
          <div
            style={{
              display: "inline-flex",
              padding: "8px 16px",
              borderRadius: "980px",
              background: "rgba(255,255,255,0.1)",
              color: "#007aff",
              fontSize: "16px",
              fontWeight: 600,
              marginBottom: "20px",
              width: "fit-content",
            }}
          >
            {category}
          </div>
        )}

        <div
          style={{
            color: "#f5f5f7",
            fontSize: subtitle ? "48px" : "56px",
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            maxWidth: "900px",
            marginBottom: subtitle ? "16px" : "0",
          }}
        >
          {title}
        </div>

        {subtitle && (
          <div
            style={{
              color: "#a1a1a6",
              fontSize: "24px",
              lineHeight: 1.4,
              maxWidth: "700px",
            }}
          >
            {subtitle}
          </div>
        )}

        <div
          style={{
            position: "absolute",
            bottom: "60px",
            right: "60px",
            color: "#6e6e73",
            fontSize: "16px",
          }}
        >
        {host}
        </div>
      </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      }
    );
  } catch (e) {
    console.error("[og]", e);
    return new Response("Failed to render image", { status: 500 });
  }
}
