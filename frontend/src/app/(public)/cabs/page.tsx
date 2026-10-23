import { notFound } from "next/navigation";
import { categoryMetadata } from "@/features/seo/category-copy";
import { CabBookingFlow } from "@/features/users/cabs/components/cab-quote-form";
import Link from "next/link";
import { getServiceCatalog, isServiceEnabled } from "@/features/services/catalog";

export const generateMetadata = () => categoryMetadata("cabs");

export default async function Page() {
  const catalog = await getServiceCatalog();
  if (catalog.length && !isServiceEnabled(catalog, "cabs")) notFound();
  return (
    <>
      <CabBookingFlow />
      <div className="mx-auto max-w-lg px-4 pb-8">
        <Link href="/cabs/scheduled" className="block rounded-2xl bg-[#f3faf7] px-5 py-4 text-sm font-semibold text-[#0f7d6e] ring-1 ring-emerald-100">
          Find vendors already going your way →
        </Link>
      </div>
    </>
  );
}
