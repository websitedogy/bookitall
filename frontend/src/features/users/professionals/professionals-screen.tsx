"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, X } from "lucide-react";
import { CategoryArt } from "@/features/home/components/category-art";
import { cn } from "@/shared/lib/cn";
import { publicBrowsePath } from "@/shared/lib/public-paths";
import { stableImage } from "@/shared/lib/stable-image";
import {
  PROFESSIONAL_META,
  professionalFallbackImage,
  type Professional,
} from "./data";

function RatingBadge({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <span className="inline-flex w-fit items-center gap-1 rounded-md bg-[#FFF4D6] px-1.5 py-[2px]">
      <Star className="h-3 w-3 fill-[#E8B923] text-[#E8B923]" aria-hidden />
      <span className="text-[12px] font-semibold text-[#1F2937]">{rating.toFixed(1)}</span>
      <span className="text-[12px] text-[#6B7280]">({reviews})</span>
    </span>
  );
}

function ProfessionalCard({
  item,
  fallback,
  onOpen,
}: {
  item: Professional;
  fallback: string;
  onOpen: (item: Professional) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="flex w-full gap-3 rounded-[1.15rem] border border-[#EFE6D8] bg-white p-3 text-left shadow-[0_1px_2px_rgba(28,20,12,0.04)] transition active:scale-[0.99]"
    >
      <span className="relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-xl bg-[#F3EDE4]">
        <Image
          src={stableImage(item.image, fallback)}
          alt={item.name}
          fill
          sizes="60px"
          className="object-cover"
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-bold tracking-tight text-[#111827]">{item.name}</span>
        <span className="mt-0.5 block truncate text-[12px] text-[#9CA3AF]">{item.categoryLabel}</span>
        <span className="mt-1.5 block">
          <RatingBadge rating={item.rating} reviews={item.reviews} />
        </span>
        <span className="mt-1.5 block truncate text-[12px] text-[#9CA3AF]">
          {item.years}+ years • {item.highlights.join(" • ")}
        </span>
      </span>
    </button>
  );
}

export function ProfessionalsScreen({
  serviceId,
  items,
  variant = "overlay",
}: {
  serviceId: string;
  items: Professional[];
  variant?: "overlay" | "embedded";
}) {
  const router = useRouter();
  const meta = PROFESSIONAL_META[serviceId];
  const fallback = professionalFallbackImage(serviceId);

  function open(item: Professional) {
    if (item.href) {
      router.push(item.href);
      return;
    }
    router.push(`${publicBrowsePath(serviceId)}?pro=${encodeURIComponent(item.id)}`);
  }

  const list = (
    <div className={cn("flex flex-col gap-2.5", variant === "overlay" ? "px-3 pb-6" : "mt-6")}>
      {items.map((item) => (
        <ProfessionalCard key={item.id} item={item} fallback={fallback} onOpen={open} />
      ))}
    </div>
  );

  if (variant === "embedded") {
    return (
      <section>
        <p className="text-[13px] font-bold tracking-[0.14em] text-[#1B5E3B] uppercase">
          Available professionals
        </p>
        {list}
      </section>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#FDF8F2]">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-[#F6EEE4] py-3 pl-12 pr-3 pt-[max(0.7rem,env(safe-area-inset-top))]">
        <span
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full"
          style={{ backgroundColor: meta?.tint ?? "#E8EEF3" }}
        >
          <CategoryArt id={serviceId} size={40} className="h-10 w-10" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[17px] font-bold tracking-tight text-[#111827]">
            {meta?.bookingTitle ?? "Booking"}
          </h1>
          <p className="truncate text-[13px] text-[#9CA3AF]">Choose a trusted professional</p>
        </div>
        <Link
          href="/"
          aria-label="Close"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8D9C4] text-[#5C5346]"
        >
          <X className="h-5 w-5" strokeWidth={2.2} />
        </Link>
      </header>
      <p className="px-4 py-3 text-[13px] font-bold tracking-[0.14em] text-[#1B5E3B] uppercase">
        Available professionals
      </p>
      {list}
    </div>
  );
}

export function ProfessionalPreview({
  serviceId,
  item,
}: {
  serviceId: string;
  item: Professional;
}) {
  const meta = PROFESSIONAL_META[serviceId];
  const fallback = professionalFallbackImage(serviceId);

  return (
    <div className="min-h-[100dvh] bg-[#FDF8F2] md:min-h-0 md:rounded-[1.6rem] md:bg-white md:p-6 md:ring-1 md:ring-[var(--border)]">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-[#F6EEE4] px-3 py-3 pt-[max(0.7rem,env(safe-area-inset-top))] md:static md:bg-transparent md:px-0 md:pt-0">
        <Link
          href={publicBrowsePath(serviceId)}
          aria-label="Back"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8D9C4] text-[#5C5346] md:bg-[var(--background-blue)]"
        >
          <X className="h-5 w-5" strokeWidth={2.2} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[17px] font-bold tracking-tight text-[#111827]">{item.name}</h1>
          <p className="truncate text-[13px] text-[#9CA3AF]">{item.categoryLabel}</p>
        </div>
      </header>
      <div className="px-4 pb-8 md:px-0">
        <div className="relative mt-3 h-44 overflow-hidden rounded-2xl">
          <Image src={stableImage(item.image, fallback)} alt={item.name} fill sizes="100vw" className="object-cover" />
        </div>
        <div className="mt-4">
          <RatingBadge rating={item.rating} reviews={item.reviews} />
          <p className="mt-3 text-sm text-[#6B7280]">
            {item.years}+ years • {item.highlights.join(" • ")}
          </p>
          <p className="mt-4 text-sm leading-6 text-[#4B5563]">
            A verified {meta?.categoryLabel.toLowerCase() ?? "professional"} on Book It All. Choose them to continue booking.
          </p>
        </div>
        {item.href ? (
          <Link
            href={item.href}
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white"
          >
            Book now
          </Link>
        ) : (
          <Link
            href="/login"
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white"
          >
            Sign in to book
          </Link>
        )}
      </div>
    </div>
  );
}
