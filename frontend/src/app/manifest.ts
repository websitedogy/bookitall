import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Book It All",
    short_name: "Book It All",
    description: "Book hotels, tours, cabs and home services in one place.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    background_color: "#f4f6fb",
    theme_color: "#1b4f72",
    orientation: "portrait",
    categories: ["travel", "lifestyle", "business"],
    lang: "en",
    dir: "ltr",
    icons: [
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
