import Link from "next/link";
import { VisibleServiceLinks } from "@/features/services/visible-service-links";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--teal)]">404</p>
      <h1 className="serif mt-3 text-5xl">That page is not on the map</h1>
      <p className="mt-4 text-[var(--ink-soft)]">The listing may have moved, or the URL is wrong.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-white">
          Home
        </Link>
        <Link href="/home-services" className="rounded-full px-5 py-2 text-sm font-semibold text-[var(--primary)] ring-1 ring-[var(--primary)]">
          All services
        </Link>
        <Link href="/contact" className="rounded-full px-5 py-2 text-sm font-semibold text-[var(--primary)] ring-1 ring-[var(--primary)]">
          Contact
        </Link>
      </div>
      <VisibleServiceLinks
        limit={6}
        className="mt-8 flex flex-wrap justify-center gap-2 text-sm"
        itemClassName="text-[var(--primary)]"
      />
    </div>
  );
}
