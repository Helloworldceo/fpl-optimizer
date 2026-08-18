import { ImageResponse } from "next/og";

export const alt = "FPL Squad Optimizer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #1e3a2f 0%, #0f2419 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 100, marginBottom: 20 }}>⚽</div>
        <div style={{ display: "flex", fontSize: 68, fontWeight: 700 }}>FPL Squad Optimizer</div>
        <div style={{ display: "flex", fontSize: 30, color: "#a7f3d0", marginTop: 20 }}>
          Build the optimal Fantasy Premier League squad — live data, budget-optimized
        </div>
      </div>
    ),
    { ...size }
  );
}
