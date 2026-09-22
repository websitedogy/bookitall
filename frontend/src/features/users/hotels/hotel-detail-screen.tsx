import { CoverImage } from "@/shared/ui/cover-image";
import type { Hotel } from "@/shared/types/catalog";
import { HotelBookingPanel } from "@/features/users/hotels/components/hotel-booking-panel";
import { inr, stars } from "@/shared/lib/format";

export function HotelDetailScreen({ hotel }: { hotel: Hotel }) {
  return (
    <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
      <article>
        <CoverImage src={hotel.coverImageUrl} alt={hotel.name} fallback="/banners/hotels.jpg" />
        <p className="mt-6 text-xs uppercase tracking-[0.2em] text-[var(--teal)]">
          {hotel.city}, {hotel.state}
        </p>
        <h1 className="serif mt-2 text-5xl">{hotel.name}</h1>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          {hotel.starRating} star · {stars(hotel.averageRating)} · {hotel.reviewCount} reviews
        </p>
        <p className="mt-6 max-w-2xl text-lg leading-8">{hotel.description}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {hotel.amenities.map((item) => (
            <span key={item} className="rounded-full bg-[var(--sand)] px-3 py-1 text-sm">
              {item}
            </span>
          ))}
        </div>
        <div className="mt-10 space-y-4">
          {(hotel.roomTypes ?? []).map((room) => (
            <div key={room.id} className="rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="serif text-2xl">{room.name}</h2>
                  <p className="text-sm text-[var(--ink-soft)]">{room.description}</p>
                </div>
                <p className="font-medium">{inr(room.pricePerNight)} / night</p>
              </div>
            </div>
          ))}
        </div>
      </article>
      <HotelBookingPanel hotel={hotel} />
    </div>
  );
}
