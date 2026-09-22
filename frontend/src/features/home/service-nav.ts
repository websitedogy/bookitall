import { publicBrowsePath, HOME_SERVICES_PATH } from "@/shared/lib/public-paths";

export const SERVICE_NAV = [
  { id: "hotels", name: "Hotels", href: publicBrowsePath("hotels") },
  { id: "tours", name: "Tours", href: publicBrowsePath("tours") },
  { id: "cabs", name: "Cabs", href: publicBrowsePath("cabs") },
  { id: "electrician", name: "Electrician", href: publicBrowsePath("electrician") },
  { id: "plumber", name: "Plumber", href: publicBrowsePath("plumber") },
  { id: "ac", name: "AC", href: publicBrowsePath("ac") },
  { id: "cleaning", name: "Cleaning", href: publicBrowsePath("cleaning") },
  { id: "jobs", name: "Jobs", href: publicBrowsePath("jobs") },
  { id: "beautician", name: "Beauty", href: publicBrowsePath("beautician") },
  { id: "painting", name: "Painting", href: publicBrowsePath("painting") },
  { id: "carpenter", name: "Carpenter", href: publicBrowsePath("carpenter") },
  { id: "appliance", name: "Appliance", href: publicBrowsePath("appliance") },
  { id: "public-transport", name: "Public Transport", href: publicBrowsePath("public-transport") },
  { id: "goods-transport", name: "Goods Transport", href: publicBrowsePath("goods-transport") },
  { id: "packers-movers", name: "Packers & Movers", href: publicBrowsePath("packers-movers") },
  { id: "cloud-kitchen", name: "Cloud Kitchen", href: publicBrowsePath("cloud-kitchen") },
] as const;

export const ALL_SERVICES_HREF = HOME_SERVICES_PATH;
