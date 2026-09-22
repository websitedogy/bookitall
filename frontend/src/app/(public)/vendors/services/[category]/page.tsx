import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VendorListingForm } from "@/features/vendors/services/vendor-listing-form";
import { VENDOR_FORMS, vendorFormById } from "@/features/vendors/services/vendor-form-config";
import { getServiceCatalog, isServiceEnabled } from "@/features/services/catalog";

type Props = { params: Promise<{ category: string }>; searchParams: Promise<{ type?: string }> };

export function generateStaticParams() {
  return Object.keys(VENDOR_FORMS).map((category) => ({ category }));
}

import { publicPageMeta } from "@/shared/lib/seo";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const form = vendorFormById(category);
  return publicPageMeta({
    title: `${form?.title ?? "Place Register"} | Book It All`,
    description: form?.subtitle || "Submit a vendor listing on Book It All for admin review.",
    path: `/vendors/services/${category}`,
  });
}

export default async function VendorCategoryFormPage({ params, searchParams }: Props) {
  const { category } = await params;
  const { type } = await searchParams;
  const form = vendorFormById(category);
  if (!form) notFound();
  const catalog = await getServiceCatalog();
  if (catalog.length && !isServiceEnabled(catalog, category)) notFound();
  return <VendorListingForm config={form} selectedType={type} />;
}
