import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const size = Math.min(parseInt(searchParams.get("size") || "192"), 512);

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: "#050D1A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Glow circle */}
        <div
          style={{
            position: "absolute",
            width: size * 0.7,
            height: size * 0.7,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(56,189,248,0.18) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        {/* Dot */}
        <div
          style={{
            width: size * 0.12,
            height: size * 0.12,
            borderRadius: "50%",
            background: "#38BDF8",
            position: "absolute",
            top: size * 0.22,
            left: size * 0.26,
            display: "flex",
          }}
        />
        {/* LUMO text */}
        <div
          style={{
            fontSize: size * 0.28,
            fontWeight: 900,
            color: "#E8F4FF",
            fontFamily: "sans-serif",
            letterSpacing: -size * 0.01,
            display: "flex",
          }}
        >
          LUMO
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}
