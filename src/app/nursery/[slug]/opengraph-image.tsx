import { ImageResponse } from "next/og";
import { getNurseryBySlug } from "@/lib/nursery-queries";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const nursery = await getNurseryBySlug(slug);
  const name = nursery?.name ?? "Find Plant Nurseries";
  const location = nursery ? `${nursery.city}, ${nursery.state}` : "";
  const specialties = nursery?.specialties.slice(0, 3).map((s) => s.specialty.name) ?? [];

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
        <div style={{ display: "flex", fontSize: 24, color: "#bfe9dd", marginBottom: 24 }}>
          Find Plant Nurseries
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 62,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: -2,
            lineHeight: 1.08,
            maxWidth: 1000,
          }}
        >
          {name}
        </div>
        {location && (
          <div style={{ display: "flex", fontSize: 30, color: "#d7f5ec", marginTop: 18 }}>
            {location}
          </div>
        )}
        {specialties.length > 0 && (
          <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
            {specialties.map((s) => (
              <div
                key={s}
                style={{
                  display: "flex",
                  fontSize: 22,
                  fontWeight: 600,
                  color: "#0a2420",
                  background: "#ffffff",
                  borderRadius: 10,
                  padding: "10px 20px",
                }}
              >
                {s}
              </div>
            ))}
          </div>
        )}
      </div>
    ),
    { ...size },
  );
}
