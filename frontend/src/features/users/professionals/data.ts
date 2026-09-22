import { SERVICES } from "@/features/home/services";
import { stableImage } from "@/shared/lib/stable-image";

export type Professional = {
  id: string;
  name: string;
  categoryLabel: string;
  image: string;
  rating: number;
  reviews: number;
  years: number;
  highlights: string[];
  href?: string;
};

export type ProfessionalMeta = {
  bookingTitle: string;
  categoryLabel: string;
  highlights: string[];
  tint: string;
  names: string[];
};

export const PROFESSIONAL_META: Record<string, ProfessionalMeta> = {
  hotels: {
    bookingTitle: "Hotel Booking",
    categoryLabel: "Hotels & Resorts",
    highlights: ["Free WiFi", "Verified Stay"],
    tint: "#E8F1F7",
    names: [
      "Parkview Banjara",
      "HITEC Harbor Suites",
      "Anjuna Tide Resort",
      "Lakeview Residency",
      "Charminar Heritage Inn",
      "Gachibowli Suites",
      "Jubilee Courtyard",
      "Kondapur Business Stay",
      "Goa Pearl Resort",
      "Vizag Beach Hotel",
      "Tirupati Yatri Nivas",
      "Araku Valley Lodge",
      "Shamshabad Airport Hotel",
      "Kukatpally Comfort Inn",
      "Necklace Road Stay",
      "Madhapur Nest",
      "Secunderabad Club Stay",
    ],
  },
  tours: {
    bookingTitle: "Tour Booking",
    categoryLabel: "Tours & Packages",
    highlights: ["Guided", "Verified Operator"],
    tint: "#F1ECF7",
    names: [
      "Sacred Trails",
      "Valley Walks",
      "Coastal Co.",
      "Godavari River Cruise",
      "Tirupati Darshan Co",
      "Srisailam Weekend",
      "Lambasingi Mist Tours",
      "Vizag Coastal Trail",
      "Papikondalu Package",
      "Belum Caves Day Trip",
      "Horsley Hills Getaway",
      "Kerala Backwaters Co",
      "Coorg Estate Walk",
      "Hampi Heritage Run",
      "Lepakshi Day Tour",
      "Nagarjuna Sagar Cruise",
    ],
  },
  cabs: {
    bookingTitle: "Cab Booking",
    categoryLabel: "Cab & Airport Transfers",
    highlights: ["AC Cars", "Verified Drivers"],
    tint: "#E8EEF3",
    names: [
      "Rajahmundry City Cabs",
      "Godavari Ride Services",
      "Royal City Cabs",
      "Sai Travels & Cabs",
      "BlueLine Cabs",
      "QuickRide Rajahmundry",
      "Vizag Airport Cabs",
      "Guntur Swift Travels",
      "Vijayawada City Rides",
      "Eluru Cab Co",
      "Kakinada Shore Cabs",
      "Ongole Highway Cabs",
      "City Cabs",
      "Highway Fleet",
      "Rent & Ride",
      "Godavari Airport Cars",
      "Coastal Outstation Cabs",
    ],
  },
  electrician: {
    bookingTitle: "Electrician Booking",
    categoryLabel: "Electrical & Wiring",
    highlights: ["Licensed", "Same-day"],
    tint: "#FFF6E8",
    names: [
      "SparkFix Hyderabad",
      "Deccan Electric",
      "HomeWire",
      "PowerGrid Hyd",
      "VoltCare",
      "RapidSpark",
      "BrightPoint Electric",
      "CurrentFix",
      "WireWorks",
      "MegaVolt Services",
      "SafeEarthing Co",
      "SwitchCraft",
      "HydLine Electric",
      "SparkOn Call",
      "CircuitCare Hyd",
      "LiveWire Gachibowli",
      "Ampere Homes",
    ],
  },
  plumber: {
    bookingTitle: "Plumber Booking",
    categoryLabel: "Plumbing & Drains",
    highlights: ["Emergency", "Parts kit"],
    tint: "#E7F3FB",
    names: [
      "QuickFlow",
      "PipeCare",
      "Gachibowli Plumb",
      "LeakGuard Hyd",
      "TapFix Pro",
      "DrainLine",
      "AquaWorks",
      "PipeRight",
      "FlowFix 24x7",
      "BathFit Plumbers",
      "CityDrain Co",
      "HydroCare",
      "ValveTech",
      "Madhapur Plumbing",
      "HITEC Pipe Crew",
      "SealWell",
      "RapidPlumb",
    ],
  },
  ac: {
    bookingTitle: "AC Booking",
    categoryLabel: "AC Repair & Service",
    highlights: ["Gas top-up", "Same-day"],
    tint: "#E8F6F4",
    names: [
      "CoolAir Hyd",
      "FrostTech",
      "ClimateCare",
      "Arctic Service",
      "BreezeFix",
      "SplitCare Pro",
      "ChillPoint",
      "AirPure AC",
      "Kondapur Cool",
      "Jubilee Frost",
      "HITEC Climate",
      "WinterCool",
      "GasTop AC",
      "FilterFresh",
      "QuietCool Hyd",
      "PeakSummer AC",
      "HomeChill",
    ],
  },
  cleaning: {
    bookingTitle: "Cleaning Booking",
    categoryLabel: "Home Cleaning",
    highlights: ["Eco detergents", "2-person crew"],
    tint: "#F3EEF8",
    names: [
      "Sparkle Crew",
      "FreshNest",
      "SoftCare",
      "ShineHouse",
      "DeepClean Hyd",
      "NeatNest",
      "GlowFloors",
      "KitchenShine",
      "BathBright",
      "MoveIn Clean",
      "UrbanSparkle",
      "Gachibowli Clean Co",
      "SofaFresh",
      "WindowLite",
      "HomeBloom Clean",
      "Spotless 2BHK",
      "PureSpace",
    ],
  },
  jobs: {
    bookingTitle: "Job Consultancy Booking",
    categoryLabel: "Job Consultancy",
    highlights: ["Resume review", "Verified"],
    tint: "#EEF3FB",
    names: [
      "CareerForge Hyd",
      "HireNest",
      "Southbound Talent",
      "PlaceWell",
      "InterviewLab",
      "ResumeCraft",
      "HITEC Careers",
      "CampusBridge",
      "OfferDesk",
      "SkillMatch Hyd",
      "FirstJob Studio",
      "HireSouth",
      "RoleReady",
      "WalkIn Desk",
      "TalentNest",
      "JobSpring",
      "CareerDock",
    ],
  },
  beautician: {
    bookingTitle: "Beauty Booking",
    categoryLabel: "Salon at Home",
    highlights: ["Kit included", "Verified artist"],
    tint: "#FBEEF3",
    names: [
      "Glow Studio",
      "Blush & Co",
      "Jubilee Beauty",
      "Bridal At Home",
      "RoseGold Makeup",
      "SilkSkin",
      "Mehendi Muse",
      "PartyGlow",
      "Banjara Salon Home",
      "Luxe Lash",
      "NudeBloom",
      "Hyd Bridal Co",
      "SoftGlam",
      "Aura Makeup",
      "Velvet Studio",
      "Petal & Paint",
      "HomeSalon Pro",
    ],
  },
  painting: {
    bookingTitle: "Painting Booking",
    categoryLabel: "Interior & Exterior Paint",
    highlights: ["Shade card", "Clean finish"],
    tint: "#EEF2FB",
    names: [
      "ColorWorks",
      "WallCare",
      "HueCraft",
      "FreshCoat",
      "Texture House",
      "TerraceSeal",
      "PaintLab Hyd",
      "WallBloom",
      "TrueTone",
      "BrushLine",
      "ShadeCard Co",
      "Miyapur Paints",
      "Kondapur Color",
      "Waterproof Pro",
      "LivingHue",
      "CoatRight",
      "PrimeWalls",
    ],
  },
  carpenter: {
    bookingTitle: "Carpenter Booking",
    categoryLabel: "Carpentry & Fittings",
    highlights: ["On-site tools", "Verified"],
    tint: "#F4EEE6",
    names: [
      "WoodRight",
      "Joinery Hyd",
      "Carpentry Co",
      "DoorFix Pro",
      "ShelfCraft",
      "WardrobeWorks",
      "HingeCare",
      "TimberLine",
      "Kukatpally Wood",
      "Madhapur Joinery",
      "LockNFit",
      "CustomCarp",
      "FrameFix",
      "Oak & Pine",
      "HomeJoinery",
      "Sawdust Studio",
      "FitRight Wood",
    ],
  },
  appliance: {
    bookingTitle: "Appliance Booking",
    categoryLabel: "Home Appliance Repair",
    highlights: ["On-site visit", "Parts quoted"],
    tint: "#E8F1F7",
    names: [
      "FixIt Home",
      "SpinCare",
      "ScreenFix Hyd",
      "CoolBox Repair",
      "WashPro",
      "MicroFix",
      "TVCare Hyd",
      "FridgeFirst",
      "HomeWatt",
      "GadgetFix",
      "WhiteGoods Co",
      "Kukatpally Repair",
      "Madhapur Appliance",
      "QuickChip",
      "Doorstep Fix",
      "CircuitCare",
      "HomeService Lab",
    ],
  },
  "public-transport": {
    bookingTitle: "Public Transport Booking",
    categoryLabel: "Public Transport",
    highlights: ["Seat booking", "Verified operator"],
    tint: "#FEF3C7",
    names: [
      "City Auto Hub",
      "ShareRide Hyd",
      "Airport Auto Desk",
      "Deccan Mini Bus",
      "Charminar Share",
      "HITEC Shuttle",
      "Secunderabad Autos",
      "NightRide Co",
      "Gachibowli Share",
      "Metro Link Auto",
      "Southbound Tempo",
      "Kukatpally Autos",
      "Madhapur Share Cab",
      "Jubilee Shuttle",
      "CityLine Bus",
      "QuickAuto Hyd",
      "RouteOne Transport",
    ],
  },
  "goods-transport": {
    bookingTitle: "Goods Transport Booking",
    categoryLabel: "Goods Transport",
    highlights: ["Local delivery", "Verified fleet"],
    tint: "#DBEAFE",
    names: [
      "Hyd Freight",
      "MiniTruck Hyd",
      "QuickLoad",
      "Deccan Logistics",
      "Pickup Pro",
      "LorryLink",
      "Gachibowli Goods",
      "HITEC Haul",
      "TonMove",
      "CityCargo",
      "ShiftLoad",
      "Kukatpally Trucks",
      "Madhapur Freight",
      "Doorstep Lorry",
      "BoxHaul Co",
      "Southbound Goods",
      "SameDay Pickup",
    ],
  },
  "packers-movers": {
    bookingTitle: "Packers & Movers Booking",
    categoryLabel: "Packers & Movers",
    highlights: ["Packing crew", "Verified movers"],
    tint: "#FFEDD5",
    names: [
      "SafeShift Hyd",
      "MoveRight",
      "BoxAndGo",
      "HouseShift Co",
      "OfficeMove Hyd",
      "CarePack",
      "DoorToDoor Shift",
      "PackLab",
      "Relocate South",
      "Gachibowli Movers",
      "HITEC Packers",
      "HomeCarton",
      "ShiftNest",
      "SecureMove",
      "CityPackers",
      "AllIndia Shift",
      "QuickRelo",
    ],
  },
  "cloud-kitchen": {
    bookingTitle: "Cloud Kitchen Booking",
    categoryLabel: "Cloud Kitchen",
    highlights: ["Delivery ready", "Verified kitchen"],
    tint: "#FFE4E6",
    names: [
      "Spice Cloud",
      "TrayKitchen",
      "Biryani Lab",
      "Tiffin Cloud",
      "MultiBrand Kitchen",
      "Hyd Commissary",
      "BowlWorks",
      "CaterCloud",
      "Gachibowli Kitchen",
      "HITEC Cloud Cook",
      "MealTray Co",
      "DarkKitchen Hyd",
      "SouthSpice Lab",
      "QuickTiffin",
      "BulkBite",
      "CloudThali",
      "KitchenNest",
    ],
  },
};

const RATINGS = [4.5, 4.7, 4.9, 4.6, 4.8, 4.5, 4.7, 4.9];

export function professionalFallbackImage(serviceId: string) {
  if (serviceId === "hotels" || serviceId === "tours" || serviceId === "cabs") {
    return `/banners/${serviceId}.jpg`;
  }
  if (serviceId === "appliance") return "/categories/appliance.png";
  if (
    serviceId === "public-transport" ||
    serviceId === "goods-transport" ||
    serviceId === "packers-movers" ||
    serviceId === "cloud-kitchen"
  ) {
    return `/categories/${serviceId}.svg`;
  }
  return `/categories/${serviceId}.png`;
}

function imagePool(serviceId: string) {
  return [
    professionalFallbackImage(serviceId),
    "/banners/hotels.jpg",
    "/banners/tours.jpg",
    "/banners/cabs.jpg",
    "/banners/home.jpg",
    `/categories/${serviceId}.png`,
  ];
}

function uniqueNames(serviceId: string) {
  const meta = PROFESSIONAL_META[serviceId];
  const service = SERVICES.find((item) => item.id === serviceId);
  const seen = new Set<string>();
  const names: string[] = [];

  const push = (name: string) => {
    const key = name.trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    names.push(name.trim());
  };

  for (const listing of service?.listings ?? []) push(listing.vendor);
  for (const name of meta?.names ?? []) push(name);
  return names;
}

export function staticProfessionals(serviceId: string): Professional[] {
  const meta = PROFESSIONAL_META[serviceId];
  if (!meta) return [];
  const names = uniqueNames(serviceId);
  const images = imagePool(serviceId);

  return names.slice(0, 20).map((name, index) => ({
    id: `${serviceId}-pro-${index + 1}`,
    name,
    categoryLabel: meta.categoryLabel,
    image: images[index % images.length],
    rating: RATINGS[index % RATINGS.length],
    reviews: 120 + index * 37,
    years: 4 + (index % 9),
    highlights: meta.highlights,
  }));
}

export function buildProfessionals(serviceId: string, apiItems: Professional[] = []): Professional[] {
  const merged: Professional[] = [];
  const seen = new Set<string>();

  const push = (item: Professional) => {
    const key = item.name.trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    merged.push({
      ...item,
      image: stableImage(item.image, professionalFallbackImage(serviceId)),
    });
  };

  for (const item of apiItems) push(item);
  return merged.slice(0, 20);
}
