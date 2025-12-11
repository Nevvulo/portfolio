import { ImageResponse } from "@vercel/og";
import type { NextRequest } from "next/server";

export const config = {
  runtime: "edge",
};

export default async function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get("title") || "Nevulo - Software Engineer";
    const subtitle = searchParams.get("subtitle") || "Building exceptional digital experiences";

    return new ImageResponse(
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1e1e2e 0%, #2d2d44 50%, #1e1e2e 100%)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234f4dc1' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            opacity: 0.3,
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px",
            textAlign: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #4f4dc1 0%, #6b69d6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "40px",
              boxShadow: "0 20px 40px rgba(79, 77, 193, 0.3)",
            }}
          >
            <span style={{ fontSize: "60px" }}>👨‍💻</span>
          </div>

          <h1
            style={{
              fontSize: "72px",
              fontWeight: "bold",
              color: "white",
              margin: 0,
              marginBottom: "20px",
              textShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            {title}
          </h1>

          <p
            style={{
              fontSize: "32px",
              color: "rgba(255, 255, 255, 0.8)",
              margin: 0,
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            {subtitle}
          </p>

          <div
            style={{
              display: "flex",
              gap: "30px",
              marginTop: "50px",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "28px", color: "rgba(255, 255, 255, 0.7)" }}>
              📍 Melbourne, Australia
            </span>
          </div>
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (e) {
    console.log(`${e instanceof Error ? e.message : "Unknown error"}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
