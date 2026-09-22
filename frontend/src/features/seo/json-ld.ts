import { SITE_URL } from "@/shared/lib/site-url";

/** NAP values copied from existing /contact page copy in this repository. Live phone Needs verification. */
const ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: "Ambedkar Centre Town",
  addressLocality: "Bhadrachalam",
  addressRegion: "Telangana",
  postalCode: "507111",
  addressCountry: "IN",
  areaServed: ["Bhadrachalam", "Hyderabad", "Telangana"],
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
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
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
