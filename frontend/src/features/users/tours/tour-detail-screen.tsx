import { CoverImage } from "@/shared/ui/cover-image";
import type { Tour } from "@/shared/types/catalog";
import { TourBookingPanel } from "@/features/users/tours/components/tour-booking-panel";
import { inr } from "@/shared/lib/format";

export function TourDetailScreen({ tour }: { tour: Tour }) {
  return (
    <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
      <article>
        <CoverImage src={tour.coverImageUrl} alt={tour.name} fallback="/banners/tours.jpg" />
        <h1 className="serif mt-6 text-5xl">{tour.name}</h1>
        <p className="mt-3 text-lg leading-8">{tour.description}</p>
        <p className="mt-4 font-medium">{inr(tour.pricePerPerson)} per person · {tour.durationDays} days</p>
        <ul className="mt-8 space-y-2">
          {tour.itinerary.map((item) => (
            <li key={item} className="rounded-2xl bg-[var(--paper)] px-4 py-3">
              {item}
            </li>
          ))}
        </ul>
      </article>
      <TourBookingPanel tour={tour} />
    </div>
  );
}
