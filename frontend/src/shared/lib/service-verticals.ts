import { publicBrowsePath } from "@/shared/lib/public-paths";

export type HomeVertical = {
  id: string;
  path: string;
  href: string;
  category: string;
  kicker: string;
  title: string;
  description: string;
};

export const HOME_VERTICALS: HomeVertical[] = [
  {
    id: "electrician",
    path: "electrician",
    href: publicBrowsePath("electrician"),
    category: "Electrical",
    kicker: "Electrician",
    title: "Fans, points, and MCB work",
    description: "Verified electricians for fittings, wiring, and safety checks across Hyderabad.",
  },
  {
    id: "plumber",
    path: "plumber",
    href: publicBrowsePath("plumber"),
    category: "Plumbing",
    kicker: "Plumber",
    title: "Leaks, taps, and drains",
    description: "Emergency and scheduled plumbing with a basic parts kit on the van.",
  },
  {
    id: "ac",
    path: "ac-repair",
    href: publicBrowsePath("ac"),
    category: "AC",
    kicker: "AC Repair",
    title: "Cool air, same-day slots",
    description: "Gas top-up, split service, and installs for west Hyderabad and beyond.",
  },
  {
    id: "cleaning",
    path: "cleaning",
    href: publicBrowsePath("cleaning"),
    category: "Cleaning",
    kicker: "House Cleaning",
    title: "Deep clean for 2BHK and up",
    description: "Kitchen, bathrooms, fans and floors with a two-person crew.",
  },
  {
    id: "jobs",
    path: "job-consultancy",
    href: publicBrowsePath("jobs"),
    category: "Jobs",
    kicker: "Job Consultancy",
    title: "Resumes, interviews, placements",
    description: "Verified consultancies for resume review, interview prep, and job shortlists.",
  },
  {
    id: "beautician",
    path: "beautician",
    href: publicBrowsePath("beautician"),
    category: "Salon at home",
    kicker: "Beauticians",
    title: "Bridal and salon at home",
    description: "Makeup, cleanup, and grooming with verified professionals.",
  },
  {
    id: "painting",
    path: "painting",
    href: publicBrowsePath("painting"),
    category: "Painting",
    kicker: "Painting",
    title: "Interior, exterior, waterproof",
    description: "Walls, texture, and terrace coats from crews that show up with the shade card.",
  },
  {
    id: "carpenter",
    path: "carpenter",
    href: publicBrowsePath("carpenter"),
    category: "Carpenter",
    kicker: "Carpenter",
    title: "Doors, shelves, wardrobes",
    description: "Furniture repair and custom fittings without a full contractor quote.",
  },
  {
    id: "appliance",
    path: "appliance",
    href: publicBrowsePath("appliance"),
    category: "Appliance",
    kicker: "Appliance Repair",
    title: "TV, fridge, washer, microwave",
    description: "Repair and installation for home appliances across Hyderabad.",
  },
  {
    id: "public-transport",
    path: "public-transport",
    href: publicBrowsePath("public-transport"),
    category: "Public Transport",
    kicker: "Public Transport",
    title: "Autos, share cabs, and buses",
    description: "Book listed autos, share cabs and intercity buses across Hyderabad.",
  },
  {
    id: "goods-transport",
    path: "goods-transport",
    href: publicBrowsePath("goods-transport"),
    category: "Goods Transport",
    kicker: "Goods Transport",
    title: "Tata Ace to heavy trucks",
    description: "Move household or commercial goods with listed Tata Ace, mini lorries and trucks.",
  },
  {
    id: "packers-movers",
    path: "packers-movers",
    href: publicBrowsePath("packers-movers"),
    category: "Packers & Movers",
    kicker: "Packers & Movers",
    title: "House and office shifting",
    description: "Packing crews and movers for local and domestic shifts in Hyderabad.",
  },
  {
    id: "cloud-kitchen",
    path: "cloud-kitchen",
    href: publicBrowsePath("cloud-kitchen"),
    category: "Cloud Kitchen",
    kicker: "Cloud Kitchen",
    title: "Delivery kitchens and catering",
    description: "Book cloud kitchens for delivery, takeaway trays and bulk catering.",
  },
];

export const SERVICE_PATHS = [
  publicBrowsePath("hotels"),
  publicBrowsePath("tours"),
  publicBrowsePath("cabs"),
  ...HOME_VERTICALS.map((vertical) => vertical.href),
] as const;

export function homeVerticalByPath(path: string) {
  return HOME_VERTICALS.find((vertical) => vertical.path === path || vertical.href === `/${path}` || vertical.href === path);
}
