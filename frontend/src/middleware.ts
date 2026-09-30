import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CANONICAL_HOST = "bookitall.in";
const ALIAS_HOSTS = new Set(["www.bookitall.in", "bookitall.com", "www.bookitall.com"]);

export function middleware(request: NextRequest) {
  const raw = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const host = raw.split(",")[0].trim().split(":")[0].toLowerCase();
  if (!ALIAS_HOSTS.has(host)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.hostname = CANONICAL_HOST;
  url.port = "";
  return NextResponse.redirect(url, 301);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
