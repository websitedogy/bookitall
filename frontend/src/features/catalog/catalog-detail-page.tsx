import { CoverImage } from "@/shared/ui/cover-image";
import { getHomeService } from "@/shared/lib/catalog-fetch";
import type { Metadata } from "next";
import { HomeServiceBookingPanel } from "@/features/home-services/components/home-service-booking-panel";
import { inr } from "@/shared/lib/format";
import { notFound } from "next/navigation";
import type { HomeVertical } from "@/shared/lib/service-verticals";
import { publicPageMeta } from "@/shared/lib/seo";
import { listingIdFromSlug } from "@/shared/lib/public-paths";
import { publicListingMetadata } from "@/features/seo/public-listing-route";

type Props = { params: Promise<{ slug: string }> };

export function catalogDetailMetadata(vertical: HomeVertical) {
  return async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    if (listingIdFromSlug(slug)) return publicListingMetadata(slug);
    const data = await getHomeService(vertical.path, slug);
    if (!data) return { title: vertical.kicker, robots: { index: false, follow: false } };
    return publicPageMeta({
      title: `${data.name} | Book It All`,
      description: (data.description || vertical.description).slice(0, 160),
      path: `${vertical.href}/${data.slug}`,
      ogImage: data.coverImageUrl || "/opengraph-image",
    });
  };
}

export async function CatalogDetailPage({
  vertical,
  params,
}: {
  vertical: HomeVertical;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = await getHomeService(vertical.path, slug);
  if (!service) {
    notFound();
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
      <article>
        <CoverImage
          src={service.coverImageUrl}
          alt={service.name}
          fallback={`/categories/${vertical.id}.png`}
          className="h-[min(72vh,560px)] w-full rounded-[2rem] bg-[#12241f]"
        />
        <h1 className="serif mt-6 text-5xl">{service.name}</h1>
        <p className="mt-3 text-lg leading-8">{service.description}</p>
        <p className="mt-4">
          {inr(service.basePrice)} · {service.durationMinutes} minutes
        </p>
      </article>
      <HomeServiceBookingPanel service={service} />
    </div>
  );
}
