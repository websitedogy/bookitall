import type { Metadata } from "next";
import { SITE_URL } from "@/shared/lib/site-url";

const OG_IMAGE = "/opengraph-image";

export const BUSINESS_CONTACT = {
  email: "bookitallinfo@gmail.com",
  phoneDisplay: "98489 05979",
  phoneHref: "+919848905979",
  address: "Ambedkar Centre Town, Bhadrachalam, Telangana 507111, India",
  city: "Bhadrachalam",
  state: "Telangana",
};

export const SITE_KEYWORDS = [
  "Book It All",
  "Book hotels in Bhadrachalam",
  "Book cabs in Bhadrachalam",
  "Book tours in Bhadrachalam",
  "Home services in Bhadrachalam",
  "Bhadrachalam service marketplace",
  "Hotel booking Bhadrachalam",
  "Cab booking Bhadrachalam",
  "Electrician in Bhadrachalam",
  "Plumber in Bhadrachalam",
  "AC repair in Bhadrachalam",
  "House cleaning in Bhadrachalam",
  "Beautician at home Bhadrachalam",
  "Moving and packers in Bhadrachalam",
  "Book It All contact",
];

export const NOINDEX: Pick<Metadata, "robots"> = {
  robots: { index: false, follow: false },
};

export function absoluteUrl(path = "/") {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function publicPageMeta({
  title,
  description,
  path,
  index = true,
  ogImage = OG_IMAGE,
  keywords = SITE_KEYWORDS,
}: {
  title: string;
  description: string;
  path: string;
  index?: boolean;
  ogImage?: string;
  keywords?: string[];
}): Metadata {
  const url = absoluteUrl(path);
  return {
    title: { absolute: title },
    description,
    keywords,
    alternates: { canonical: url },
    robots: index ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      title,
      description,
      url,
      siteName: "Book It All",
      locale: "en_IN",
      type: "website",
      images: [{ url: absoluteUrl(ogImage), width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl(ogImage)],
    },
  };
}
