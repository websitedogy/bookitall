import { permanentRedirect } from "next/navigation";
import { getTour } from "@/shared/lib/catalog-fetch";

type Props = { params: Promise<{ slug: string }> };

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const tour = await getTour(slug);
  if (tour) permanentRedirect(`/tours/${tour.slug}`);
  permanentRedirect(`/tours/${slug}`);
}
