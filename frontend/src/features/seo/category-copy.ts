import { HOME_VERTICALS } from "@/shared/lib/service-verticals";
import { HOME_SERVICES_PATH, publicBrowsePath } from "@/shared/lib/public-paths";
import { publicPageMeta } from "@/shared/lib/seo";

export type CategorySeo = {
  id: string;
  path: string;
  title: string;
  description: string;
  h1: string;
  serviceType: string;
  faqs: { question: string; answer: string }[];
};

function vertical(id: string) {
  return HOME_VERTICALS.find((item) => item.id === id);
}

export const CATEGORY_SEO: Record<string, CategorySeo> = {
  hotels: {
    id: "hotels",
    path: publicBrowsePath("hotels"),
    title: "Hotels & Resorts in Hyderabad and Beyond | Book It All",
    description:
      "Book hotels and resorts with live listings. Start in Hyderabad, then Goa, Kerala and more. Compare nearby stays and reserve in one checkout.",
    h1: "Hotels and resorts you can book today",
    serviceType: "Hotel booking",
    faqs: [
      {
        question: "How do I book a hotel on Book It All?",
        answer: "Open Hotels, pick an accepted listing, choose check-in and check-out, then pay with UPI, card, net banking, wallet, or pay after service where offered.",
      },
      {
        question: "Are the hotel listings live inventory?",
        answer: "Yes. Public hotel cards are vendor listings that admin has accepted. Pending or rejected posts are not shown to customers.",
      },
    ],
  },
  tours: {
    id: "tours",
    path: publicBrowsePath("tours"),
    title: "Tour Packages from Hyderabad | Book It All",
    description: "Book guided tours and travel packages from Hyderabad. See live operator listings, dates and prices, then reserve in one checkout.",
    h1: "Tours and packages from Hyderabad",
    serviceType: "Tour package",
    faqs: [
      {
        question: "What tour details do I need to book?",
        answer: "Pick a live tour listing, choose a travel date and the number of travelers, then confirm payment on checkout.",
      },
    ],
  },
  cabs: {
    id: "cabs",
    path: publicBrowsePath("cabs"),
    title: "Cab Booking in Hyderabad | Airport, Local, Outstation | Book It All",
    description: "Book a listed cab in Hyderabad for local, outstation or airport trips. Choose a vendor, add pickup and drop, then confirm.",
    h1: "Cabs and airport transfers in Hyderabad",
    serviceType: "Cab booking",
    faqs: [
      {
        question: "How does cab booking work?",
        answer: "Choose an accepted cab listing, enter pickup and drop, then confirm. Live tracking and vehicle details come from the vendor listing.",
      },
    ],
  },
  electrician: {
    id: "electrician",
    path: publicBrowsePath("electrician"),
    title: "Electrician in Hyderabad | Fan, Wiring, MCB | Book It All",
    description:
      "Book verified electricians in Hyderabad for fans, points, wiring and safety checks. See nearby listings, prices and photos, then pick a slot.",
    h1: "Electricians in Hyderabad",
    serviceType: "Electrical repair and installation",
    faqs: [
      {
        question: "What electrician work can I book in Hyderabad?",
        answer: vertical("electrician")?.description ?? "Verified electricians for fittings, wiring, and safety checks across Hyderabad.",
      },
      {
        question: "How do I book an electrician near me?",
        answer: "Open Electrician, pick an accepted nearby listing, choose a slot and address, then pay with UPI or pay after service.",
      },
    ],
  },
  plumber: {
    id: "plumber",
    path: publicBrowsePath("plumber"),
    title: "Plumber in Hyderabad | Leaks, Taps, Drains | Book It All",
    description: "Book emergency and scheduled plumbing in Hyderabad. See accepted nearby listings with prices and photos, then pick a visit slot.",
    h1: "Plumbers in Hyderabad",
    serviceType: "Plumbing",
    faqs: [
      {
        question: "What plumbing jobs are listed?",
        answer: vertical("plumber")?.description ?? "Emergency and scheduled plumbing with a basic parts kit on the van.",
      },
    ],
  },
  ac: {
    id: "ac",
    path: publicBrowsePath("ac"),
    title: "AC Repair in Hyderabad | Gas, Service, Install | Book It All",
    description: "Book AC repair in Hyderabad for gas top-up, split service and installs. Compare accepted technician listings and reserve a slot.",
    h1: "AC repair in Hyderabad",
    serviceType: "Air conditioner repair",
    faqs: [
      {
        question: "What AC services can I book?",
        answer: vertical("ac")?.description ?? "Gas top-up, split service, and installs for west Hyderabad and beyond.",
      },
    ],
  },
  cleaning: {
    id: "cleaning",
    path: publicBrowsePath("cleaning"),
    title: "House Cleaning Services in Hyderabad | Book It All",
    description: "Book house cleaning in Hyderabad for kitchens, bathrooms, fans and floors. See accepted crew listings and choose a slot.",
    h1: "House cleaning in Hyderabad",
    serviceType: "House cleaning",
    faqs: [
      {
        question: "What does a home cleaning listing include?",
        answer: vertical("cleaning")?.description ?? "Kitchen, bathrooms, fans and floors with a two-person crew.",
      },
    ],
  },
  beautician: {
    id: "beautician",
    path: publicBrowsePath("beautician"),
    title: "Salon at Home in Hyderabad | Beauticians | Book It All",
    description: "Book bridal makeup, cleanup and salon-at-home in Hyderabad from accepted beautician listings.",
    h1: "Beauticians in Hyderabad",
    serviceType: "Salon at home",
    faqs: [
      {
        question: "What beauty services are listed?",
        answer: vertical("beautician")?.description ?? "Makeup, cleanup, and grooming with verified professionals.",
      },
    ],
  },
  painting: {
    id: "painting",
    path: publicBrowsePath("painting"),
    title: "House Painting Services in Hyderabad | Book It All",
    description: "Book interior, exterior and waterproof painting in Hyderabad from accepted painting crews.",
    h1: "House painting in Hyderabad",
    serviceType: "House painting",
    faqs: [
      {
        question: "What painting work can I book?",
        answer: vertical("painting")?.description ?? "Walls, texture, and terrace coats from crews that show up with the shade card.",
      },
    ],
  },
  carpenter: {
    id: "carpenter",
    path: publicBrowsePath("carpenter"),
    title: "Carpenter in Hyderabad | Doors, Shelves, Wardrobes | Book It All",
    description: "Book carpenters in Hyderabad for furniture repair and custom fittings. See accepted listings and reserve a visit.",
    h1: "Carpenters in Hyderabad",
    serviceType: "Carpentry",
    faqs: [
      {
        question: "What carpenter jobs are listed?",
        answer: vertical("carpenter")?.description ?? "Furniture repair and custom fittings without a full contractor quote.",
      },
    ],
  },
  appliance: {
    id: "appliance",
    path: publicBrowsePath("appliance"),
    title: "Appliance Repair in Hyderabad | Fridge, Washer, TV | Book It All",
    description: "Book TV, fridge, washer and microwave repair in Hyderabad from accepted technicians.",
    h1: "Appliance repair in Hyderabad",
    serviceType: "Home appliance repair",
    faqs: [
      {
        question: "Which appliances can be repaired?",
        answer: vertical("appliance")?.description ?? "Repair and installation for home appliances across Hyderabad.",
      },
    ],
  },
  jobs: {
    id: "jobs",
    path: publicBrowsePath("jobs"),
    title: "Job Consultancy in Hyderabad | Book It All",
    description: "Book verified job consultancies in Hyderabad for resume review, interview prep and placements.",
    h1: "Job consultancies in Hyderabad",
    serviceType: "Job consultancy",
    faqs: [
      {
        question: "What do job consultancy listings cover?",
        answer: vertical("jobs")?.description ?? "Verified consultancies for resume review, interview prep, and job shortlists.",
      },
    ],
  },
  "public-transport": {
    id: "public-transport",
    path: publicBrowsePath("public-transport"),
    title: "Public Transport in Hyderabad | Auto, Share Cab, Bus | Book It All",
    description: "Book listed autos, share cabs and intercity buses in Hyderabad. See accepted operators, seats and prices, then reserve.",
    h1: "Public transport in Hyderabad",
    serviceType: "Public transport booking",
    faqs: [
      {
        question: "What public transport can I book?",
        answer: vertical("public-transport")?.description ?? "Book listed autos, share cabs and intercity buses across Hyderabad.",
      },
    ],
  },
  "goods-transport": {
    id: "goods-transport",
    path: publicBrowsePath("goods-transport"),
    title: "Goods Transport in Hyderabad | Tata Ace, Truck, Lorry | Book It All",
    description: "Book Tata Ace, mini lorries, and light to heavy trucks in Hyderabad. See vehicle type, load capacity and prices, then reserve.",
    h1: "Goods transport in Hyderabad",
    serviceType: "Goods transport",
    faqs: [
      {
        question: "What goods transport can I book?",
        answer: "Tata Ace, Mini Lorry, Light / Medium / Heavy Truck, or Other. Listings show load capacity after admin accepts.",
      },
    ],
  },
  "packers-movers": {
    id: "packers-movers",
    path: publicBrowsePath("packers-movers"),
    title: "Packers and Movers in Hyderabad | Home & Office Shift | Book It All",
    description: "Book home, office, local or long-distance packers and movers. See accepted listings after admin review.",
    h1: "Packers and movers in Hyderabad",
    serviceType: "Packers and movers",
    faqs: [
      {
        question: "What shifting work can I book?",
        answer: "Home shifting, office shifting, local shifting, long-distance shifting, or other moving work listed by accepted vendors.",
      },
    ],
  },
  "cloud-kitchen": {
    id: "cloud-kitchen",
    path: publicBrowsePath("cloud-kitchen"),
    title: "Cloud Kitchen in Hyderabad | Delivery & Catering | Book It All",
    description: "Book cloud kitchens in Hyderabad for delivery, takeaway trays and bulk catering from accepted kitchen listings.",
    h1: "Cloud kitchens in Hyderabad",
    serviceType: "Cloud kitchen",
    faqs: [
      {
        question: "What do cloud kitchen listings cover?",
        answer: vertical("cloud-kitchen")?.description ?? "Book cloud kitchens for delivery, takeaway trays and bulk catering.",
      },
    ],
  },
};

export const HOME_SERVICES_SEO: CategorySeo = {
  id: "home-services",
  path: HOME_SERVICES_PATH,
  title: "Home Services in Hyderabad | Book It All",
  description: "Book electrician, plumber, AC, cleaning, beauty, painting, carpenter, appliance, transport, movers and cloud kitchen services in Hyderabad from one account.",
  h1: "Home services in Hyderabad",
  serviceType: "Home services",
  faqs: [
    {
      question: "Which home services can I book?",
      answer: "Electrician, plumber, AC repair, house cleaning, beautician, painting, carpenter and appliance repair, plus job consultancy, public and goods transport, packers and movers, and cloud kitchens.",
    },
  ],
};

export function categorySeo(id: string) {
  return CATEGORY_SEO[id];
}

export function categoryMetadata(id: string) {
  const seo = CATEGORY_SEO[id];
  if (!seo) return { title: id };
  return publicPageMeta({ title: seo.title, description: seo.description, path: seo.path });
}

