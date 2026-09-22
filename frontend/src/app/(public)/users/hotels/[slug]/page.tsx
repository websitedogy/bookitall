import { permanentRedirect } from "next/navigation";
import { getHotel } from "@/shared/lib/catalog-fetch";
import { slugify } from "@/shared/lib/public-paths";

type Props = { params: Promise<{ slug: string }> };

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const hotel = await getHotel(slug);
  if (hotel) {
    permanentRedirect(`/hotels/${slugify(hotel.city) || "hyderabad"}/${hotel.slug}`);
  }
  permanentRedirect(`/hotels/hyderabad/${slug}`);
}
