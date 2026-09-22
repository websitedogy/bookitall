import { notFound, permanentRedirect } from "next/navigation";
import { SERVICE_FOLDERS, serviceIdFromFolder } from "@/features/seo/service-folders";

type Props = { params: Promise<{ service: string }> };

export function generateStaticParams() {
  return Object.keys(SERVICE_FOLDERS).map((service) => ({ service }));
}

export default async function Page({ params }: Props) {
  const { service } = await params;
  if (!serviceIdFromFolder(service)) notFound();
  permanentRedirect(`/${service}/hyderabad`);
}
