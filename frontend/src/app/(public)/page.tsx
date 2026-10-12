import type { Metadata } from "next";
import { HomePage } from "@/features/home";
import { categoryArtSrc } from "@/features/home/components/category-art";
import { visibleServiceNav } from "@/features/services/catalog";
import { publicPageMeta } from "@/shared/lib/seo";

export const dynamic = "force-static";

export const metadata: Metadata = publicPageMeta({
  title: "Book Hotels, Tours, Cabs & Home Services | Book It All",
  description:
    "Book stays, trips, rides and home visits in Hyderabad from one account. Compare nearby listings, pick a slot, pay with UPI.",
  path: "/",
});

export default function Page() {
  return (
    <>
      {visibleServiceNav(null).map((service, index) => (
        <link key={service.id} rel="preload" as="image" href={categoryArtSrc(service.id)} fetchPriority={index < 4 ? "high" : "low"} />
      ))}
      <HomePage />
    </>
  );
}
