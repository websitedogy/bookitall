import { HOME_SERVICES_PATH, publicBrowsePath } from "@/shared/lib/public-paths";

export const BANNERS = [
  {
    id: "hotels",
    href: publicBrowsePath("hotels"),
    kicker: "Stays",
    title: "Hotels & Resorts",
    text: "Rooms you can actually trust.",
    className: "bg-[#0f766e]",
    image: "/banners/hotels.png",
  },
  {
    id: "tours",
    href: publicBrowsePath("tours"),
    kicker: "Travel",
    title: "Tours & Packages",
    text: "Pilgrimage to weekend getaways.",
    className: "bg-[#0b5f59]",
    image: "/banners/tours.jpg",
  },
  {
    id: "cabs",
    href: publicBrowsePath("cabs"),
    kicker: "Rides",
    title: "Cabs & Rentals",
    text: "Local, outstation, live tracking.",
    className: "bg-[#134e4a]",
    image: "/banners/cabs.png",
  },
  {
    id: "home",
    href: HOME_SERVICES_PATH,
    kicker: "Home",
    title: "Experts near you",
    text: "Electrician to carpenter, booked in minutes.",
    className: "bg-[#0f766e]",
    image: "/banners/home.jpg",
  },
] as const;
