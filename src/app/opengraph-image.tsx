import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg, #0a2420 0%, #0ea895 60%, #86e6b0 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 84,
            height: 84,
            borderRadius: 999,
            background: "#ffffff",
            marginBottom: 40,
          }}
        >
          <svg width="46" height="46" viewBox="0 0 24 24" fill="#0ea895">
            <path d="M12 2C7.6 2 4 5.6 4 10c0 6 8 12 8 12s8-6 8-12c0-4.4-3.6-8-8-8Z" />
          </svg>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 68,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: -2,
            lineHeight: 1.05,
          }}
        >
          Find Plant Nurseries
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#d7f5ec", marginTop: 20 }}>
          A nationwide directory of plant nurseries and garden centers
        </div>
      </div>
    ),
    { ...size },
  );
}
