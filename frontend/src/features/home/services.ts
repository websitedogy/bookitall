export type VendorListing = {
  name: string;
  vendor: string;
  location: string;
  image: string;
};

export type ServiceItem = {
  id: string;
  name: string;
  href: string;
  image: string;
  features: string[];
  listings: VendorListing[];
};

export { BANNERS } from "./banners";

function art(id: string) {
  if (id === "hotels" || id === "tours" || id === "cabs") return `/banners/${id}.jpg`;
  if (id === "public-transport" || id === "goods-transport" || id === "packers-movers" || id === "cloud-kitchen") {
    return `/categories/${id}.svg`;
  }
  return `/categories/${id}.png`;
}

export const SERVICES: ServiceItem[] = [
  {
    id: "hotels",
    name: "Hotels",
    href: "/hotels",
    image: art("hotels"),
    features: [
      "Hotel / Resort search",
      "Room booking",
      "Pricing & availability",
      "Coupons / discounts",
      "Cancellation & refunds",
    ],
    listings: [],
  },
  {
    id: "tours",
    name: "Tours",
    href: "/tours",
    image: art("tours"),
    features: [
      "Pilgrimage tours",
      "Honeymoon packages",
      "Adventure trips",
      "Weekend getaways",
      "Custom itineraries",
    ],
    listings: [],
  },
  {
    id: "cabs",
    name: "Cabs",
    href: "/cabs",
    image: art("cabs"),
    features: [
      "Local rides",
      "Outstation one-way",
      "Outstation round trip",
      "Hourly rentals",
      "Live driver tracking",
      "OTP ride start",
    ],
    listings: [],
  },
  {
    id: "electrician",
    name: "Electrician",
    href: "/electrician/hyderabad",
    image: art("electrician"),
    features: ["Fan & light fitting", "MCB / fuse repair", "New point wiring", "Inverter setup"],
    listings: [],
  },
  {
    id: "plumber",
    name: "Plumber",
    href: "/plumber/hyderabad",
    image: art("plumber"),
    features: ["Leak repair", "Tap & mixer", "Drain cleaning", "Bathroom fitting"],
    listings: [],
  },
  {
    id: "ac",
    name: "AC",
    href: "/ac-repair/hyderabad",
    image: art("ac"),
    features: ["Gas top-up", "Split AC service", "Installation", "Same-day slots"],
    listings: [],
  },
  {
    id: "cleaning",
    name: "Cleaning",
    href: "/cleaning/hyderabad",
    image: art("cleaning"),
    features: ["Deep clean 2BHK+", "Kitchen & bath", "Sofa shampoo", "Move-in clean"],
    listings: [],
  },
  {
    id: "jobs",
    name: "Jobs",
    href: "/jobs/hyderabad",
    image: art("jobs"),
    features: ["Resume review", "Interview prep", "Placement drives", "Walk-in shortlists"],
    listings: [],
  },
  {
    id: "beautician",
    name: "Beauty",
    href: "/beautician/hyderabad",
    image: art("beautician"),
    features: ["Bridal makeup", "Salon at home", "Cleanup & facial", "Mehendi"],
    listings: [],
  },
  {
    id: "painting",
    name: "Painting",
    href: "/painting/hyderabad",
    image: art("painting"),
    features: ["Interior walls", "Exterior paint", "Waterproofing", "Texture finish"],
    listings: [],
  },
  {
    id: "carpenter",
    name: "Carpenter",
    href: "/carpenter/hyderabad",
    image: art("carpenter"),
    features: ["Furniture repair", "Door & lock", "Wardrobe fitting", "Custom shelves"],
    listings: [],
  },
  {
    id: "appliance",
    name: "Appliance",
    href: "/appliance/hyderabad",
    image: art("appliance"),
    features: ["TV repair", "Fridge service", "Washing machine", "Microwave"],
    listings: [],
  },
  {
    id: "public-transport",
    name: "Public Transport",
    href: "/public-transport/hyderabad",
    image: art("public-transport"),
    features: ["City auto & share", "Intercity buses", "Airport drops", "Seat booking"],
    listings: [],
  },
  {
    id: "goods-transport",
    name: "Goods Transport",
    href: "/goods-transport/hyderabad",
    image: art("goods-transport"),
    features: ["Tata Ace", "Mini lorry", "Light to heavy truck", "Load by capacity"],
    listings: [],
  },
  {
    id: "packers-movers",
    name: "Packers & Movers",
    href: "/packers-movers/hyderabad",
    image: art("packers-movers"),
    features: ["Home shifting", "Office shifting", "Local move", "Long-distance"],
    listings: [],
  },
  {
    id: "cloud-kitchen",
    name: "Cloud Kitchen",
    href: "/cloud-kitchen/hyderabad",
    image: art("cloud-kitchen"),
    features: ["Delivery kitchen", "Bulk / catering", "Multi-brand", "Takeaway trays"],
    listings: [],
  },
];

export type CustomerAd = {
  id: string;
  categoryId: string;
  category: string;
  title: string;
  vendor: string;
  location: string;
  image: string;
  href: string;
};

const groupedAds = SERVICES.map((service) =>
  service.listings.map((listing, index) => ({
    id: `${service.id}-${index}`,
    categoryId: service.id,
    category: service.name,
    title: listing.name,
    vendor: listing.vendor,
    location: listing.location,
    image: listing.image,
    href: service.href,
  })),
);

export const VENDOR_ADS: CustomerAd[] = (() => {
  const mixed: CustomerAd[] = [];
  const depth = Math.max(0, ...groupedAds.map((group) => group.length));
  for (let i = 0; i < depth; i += 1) {
    for (const group of groupedAds) {
      if (group[i]) mixed.push(group[i]);
    }
  }
  return mixed;
})();
