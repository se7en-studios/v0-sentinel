import { ImageResponse } from "next/og";

export const alt =
  "Sentinel Technologies, tecnología que protege tu territorio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#faf7f0",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(15,122,79,0.18) 0%, transparent 70%)",
          display: "flex",
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "#0f4a34",
            border: "3px solid #0f7a4f",
            display: "flex",
          }}
        />
        <div
          style={{
            fontSize: 40,
            fontWeight: 700,
            letterSpacing: 6,
            color: "#1a1812",
            display: "flex",
          }}
        >
          SENTINEL
        </div>
      </div>
      <div
        style={{
          fontSize: 56,
          fontWeight: 700,
          color: "#1a1812",
          textAlign: "center",
          maxWidth: 900,
          lineHeight: 1.15,
          display: "flex",
        }}
      >
        Tecnología que protege tu territorio
      </div>
      <div
        style={{
          fontSize: 26,
          color: "#0f7a4f",
          marginTop: 28,
          display: "flex",
        }}
      >
        Detección temprana de incendios con satélites e IA
      </div>
    </div>,
    { ...size },
  );
}
