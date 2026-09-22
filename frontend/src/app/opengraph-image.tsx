import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Book It All — hotels, tours, cabs and home services";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
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
          background: "#0f3d38",
          color: "#fffdf8",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 6, textTransform: "uppercase", opacity: 0.75 }}>Book It All</div>
        <div style={{ marginTop: 18, fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>Hotels, tours, cabs and home services</div>
        <div style={{ marginTop: 24, fontSize: 28, opacity: 0.85 }}>Hyderabad · one account on web and app</div>
      </div>
    ),
    { ...size },
  );
}
