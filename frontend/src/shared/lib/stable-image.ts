function uploadPath(src: string) {
  if (src.startsWith("/uploads/")) return src;
  if (!src.startsWith("http://") && !src.startsWith("https://")) return "";
  try {
    const url = new URL(src);
    if (url.pathname.startsWith("/uploads/")) return `${url.pathname}${url.search}`;
  } catch {
    return "";
  }
  return "";
}

export function mediaUrl(src: string) {
  const path = uploadPath(src);
  if (!path) return src;
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configured?.startsWith("http")) {
    const origin = configured.replace("://localhost", "://127.0.0.1").replace(/\/api\/v1\/?$/, "");
    return `${origin}${path}`;
  }
  return path;
}

export function stableImage(src: string | undefined, fallback: string) {
  if (!src) return fallback;
  if (src.startsWith("/uploads/")) return mediaUrl(src);
  if (src.startsWith("/")) return src;
  if (src.includes("images.unsplash.com") || src.includes("plus.unsplash.com")) return fallback;
  return src;
}
