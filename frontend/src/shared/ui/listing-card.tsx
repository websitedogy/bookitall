import Link from "next/link";
import { stableImage } from "@/shared/lib/stable-image";

export function ListingCard({
  href,
  image,
  fallback = "/banners/hotels.jpg",
  eyebrow,
  title,
  meta,
  price,
}: {
  href: string;
  image: string;
  fallback?: string;
  eyebrow: string;
  title: string;
  meta: string;
  price?: string;
  priority?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group overflow-hidden rounded-[1.6rem] border border-[var(--line)] bg-[var(--paper)] shadow-[0_20px_50px_-32px_rgba(20,32,28,0.45)]"
    >
      <div className="relative h-52 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={stableImage(image, fallback)}
          alt={title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="space-y-2 p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--teal)]">{eyebrow}</p>
        <h3 className="serif text-2xl leading-tight">{title}</h3>
        <p className="text-sm text-[var(--ink-soft)]">{meta}</p>
        {price ? <p className="pt-2 text-sm font-medium">{price}</p> : null}
      </div>
    </Link>
  );
}
