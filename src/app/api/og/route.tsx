import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "Venkat — Developer & Writer";
  const subtitle = searchParams.get("subtitle") || "";
  const category = searchParams.get("category") || "";

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
          venkat.dev
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
