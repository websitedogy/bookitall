import { notFound, permanentRedirect } from "next/navigation";
import { serviceIdFromFolder } from "@/features/seo/service-folders";

type Props = { params: Promise<{ service: string; slug: string }> };

export default async function Page({ params }: Props) {
  const { service, slug } = await params;
  if (!serviceIdFromFolder(service)) notFound();
  if (slug === "hyderabad") permanentRedirect(`/${service}/hyderabad`);
  permanentRedirect(`/${service}/hyderabad/${slug}`);
}
