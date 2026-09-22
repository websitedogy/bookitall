export function mediaUrl(src: string) {
  if (!src.startsWith("/uploads/")) return src;
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configured?.startsWith("http")) {
    const origin = configured.replace("://localhost", "://127.0.0.1").replace(/\/api\/v1\/?$/, "");
    return `${origin}${src}`;
  }
  return src;
}

export function stableImage(src: string | undefined, fallback: string) {
  if (!src) return fallback;
  if (src.startsWith("/uploads/")) return mediaUrl(src);
  if (src.startsWith("/")) return src;
  if (src.includes("images.unsplash.com") || src.includes("plus.unsplash.com")) return fallback;
  return src;
}
