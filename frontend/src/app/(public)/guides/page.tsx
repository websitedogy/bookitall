import type { Metadata } from "next";
import { publicPageMeta } from "@/shared/lib/seo";
import { VisibleServiceLinks } from "@/features/services/visible-service-links";

export const metadata: Metadata = publicPageMeta({
  title: "Guides | Book It All",
  description: "Hyderabad booking guides for hotels, tours, cabs and home services. Articles publish when they can link to live accepted listings.",
  path: "/guides",
});

export default function GuidesPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight">Guides</h1>
      <p className="mt-3 text-[var(--text-muted)]">
        Topic cluster pages will live here. We only publish a locality or city guide when enough accepted listings exist for that area — no empty doorway pages.
      </p>
      <h2 className="mt-8 text-lg font-semibold">Book these services now</h2>
      <VisibleServiceLinks
        className="mt-4 grid gap-2 sm:grid-cols-2"
        itemClassName="block rounded-2xl bg-white px-4 py-3 ring-1 ring-[var(--border)]"
      />
    </div>
  );
}
