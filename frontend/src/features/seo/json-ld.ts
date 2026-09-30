import { SITE_URL } from "@/shared/lib/site-url";

/** NAP values copied from existing /contact page copy in this repository. Live phone Needs verification. */
const ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: "Ambedkar Centre Town",
  addressLocality: "Bhadrachalam",
  addressRegion: "Telangana",
  postalCode: "507111",
  addressCountry: "IN",
};

export function organizationGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#org`,
        name: "Book It All",
        url: `${SITE_URL}/`,
        email: "bookitallinfo@gmail.com",
        telephone: "+91 98489 05979",
        address: ADDRESS,
        areaServed: ["Bhadrachalam", "Hyderabad", "Telangana"],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: "Book It All",
        description: "Book hotels, tours, cabs and home services with a single account in Hyderabad and nearby areas.",
        publisher: { "@id": `${SITE_URL}/#org` },
      },
    ],
  };
}

export function localBusinessNode() {
  return {
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/contact#local`,
    name: "Book It All",
    url: `${SITE_URL}/contact`,
    email: "bookitallinfo@gmail.com",
    telephone: "+91 98489 05979",
    address: ADDRESS,
    areaServed: ["Bhadrachalam", "Hyderabad", "Telangana"],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "09:00",
        closes: "20:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Sunday",
        opens: "10:00",
        closes: "18:00",
      },
    ],
  };
}

export function serviceJsonLd({
  name,
  serviceType,
  url,
  description,
  lowPrice,
  highPrice,
}: {
  name: string;
  serviceType: string;
  url: string;
  description: string;
  lowPrice?: number;
  highPrice?: number;
}) {
  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    serviceType,
    description,
    url,
    provider: { "@id": `${SITE_URL}/#org` },
    areaServed: { "@type": "City", "name": "Hyderabad" },
  };
  if (lowPrice != null && highPrice != null && lowPrice > 0 && highPrice >= lowPrice) {
    node.offers = {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: String(lowPrice),
      highPrice: String(highPrice),
    };
  }
  return node;
}

export function listingJsonLd({
  title,
  description,
  path,
  image,
  categoryId,
  location,
  price,
}: {
  title: string;
  description?: string;
  path: string;
  image?: string;
  categoryId: string;
  location?: string;
  price?: string | number | null;
}) {
  const url = `${SITE_URL}${path}`;
  const stay = categoryId === "hotels" || categoryId === "homestay";
  const photo = image
    ? image.startsWith("http")
      ? image
      : `${SITE_URL}${image.startsWith("/") ? image : `/${image}`}`
    : undefined;
  const amount = price == null ? NaN : Number(String(price).replace(/[^\d.]/g, ""));
  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": stay ? "LodgingBusiness" : "Service",
    name: title,
    url,
    description: description?.trim() || `${title} on Book It All`,
    provider: { "@id": `${SITE_URL}/#org` },
    areaServed: { "@type": "AdministrativeArea", name: "Telangana" },
  };
  if (photo) node.image = photo;
  if (location?.trim()) {
    node.address = { "@type": "PostalAddress", streetAddress: location.trim(), addressCountry: "IN" };
  }
  if (Number.isFinite(amount) && amount > 0) {
    node.offers = {
      "@type": "Offer",
      priceCurrency: "INR",
      price: String(amount),
      availability: "https://schema.org/InStock",
      url,
    };
  }
  return node;
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
