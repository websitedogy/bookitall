import { notFound } from "next/navigation";
import { categoryMetadata } from "@/features/seo/category-copy";
import { BrowseServicePage } from "@/features/seo/browse-service-page";
import { SERVICE_FOLDERS, serviceIdFromFolder } from "@/features/seo/service-folders";

type Props = { params: Promise<{ service: string }>; searchParams: Promise<{ pro?: string; type?: string }> };

export function generateStaticParams() {
  return Object.keys(SERVICE_FOLDERS).map((service) => ({ service }));
}

export async function generateMetadata({ params }: Props) {
  const { service } = await params;
  const id = serviceIdFromFolder(service);
  if (!id) return { title: "Service" };
  return categoryMetadata(id);
}

export default async function Page({ params, searchParams }: Props) {
  const { service } = await params;
  const id = serviceIdFromFolder(service);
  if (!id) notFound();
  return <BrowseServicePage serviceId={id} searchParams={searchParams} />;
}
