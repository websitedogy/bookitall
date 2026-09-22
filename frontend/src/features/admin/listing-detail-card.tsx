"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Ban, CalendarClock, CheckCircle2, ClipboardList, Wrench } from "lucide-react";
import { mediaUrl } from "@/shared/lib/stable-image";
import { ListingThumb } from "@/shared/ui/listing-thumb";
import { orderBookingsHref, StatusPill } from "@/features/admin/admin-ui";
import type { AdminListing, OrderCounts } from "@/features/admin/types";

function uploadedPhotos(listing: AdminListing) {
  const urls = listing.photoUrls?.length ? listing.photoUrls : listing.image ? [listing.image] : [];
  return urls.filter((src) => src.startsWith("/uploads/") || src.includes("/uploads/"));
}

export function AdminPhotos({ listing }: { listing: AdminListing }) {
  const photos = uploadedPhotos(listing);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open == null) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(null);
      if (event.key === "ArrowRight") setOpen((i) => (i == null ? i : (i + 1) % photos.length));
      if (event.key === "ArrowLeft") setOpen((i) => (i == null ? i : (i - 1 + photos.length) % photos.length));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, photos.length]);

  if (!photos.length) {
    return <p className="text-xs text-slate-400">No photos uploaded.</p>;
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {photos.map((src, index) => (
          <button
            key={`${src}-${index}`}
            type="button"
            onClick={() => setOpen(index)}
            className="relative h-20 w-24 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200 transition hover:ring-emerald-400"
          >
            <ListingThumb src={src} categoryId={listing.categoryId || "jobs"} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      {open != null ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/85 p-4" onClick={() => setOpen(null)}>
          <button type="button" className="absolute right-4 top-4 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white" onClick={() => setOpen(null)}>
            Close
          </button>
          {photos.length > 1 ? (
            <button
              type="button"
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/15 px-3 py-2 text-white"
              onClick={(e) => {
                e.stopPropagation();
                setOpen((open - 1 + photos.length) % photos.length);
              }}
            >
              ‹
            </button>
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaUrl(photos[open])}
            alt={listing.title}
            className="max-h-[90vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          {photos.length > 1 ? (
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/15 px-3 py-2 text-white"
              onClick={(e) => {
                e.stopPropagation();
                setOpen((open + 1) % photos.length);
              }}
            >
              ›
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

export function AdminListingFields({ listing }: { listing: AdminListing }) {
  const details = listing.details ?? [];
  return (
    <div className="mt-3 space-y-3">
      <AdminPhotos listing={listing} />
      {listing.description ? <p className="text-sm leading-6 text-slate-600">{listing.description}</p> : null}
      {details.length ? (
        <dl className="grid gap-2 sm:grid-cols-2">
          {details.map((item) => (
            <div key={`${item.key}-${item.label}`} className="rounded-xl bg-slate-50 px-3 py-2">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{item.label}</dt>
              <dd className="mt-0.5 break-words text-sm text-slate-800">{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-xs text-slate-400">No extra fields on this post.</p>
      )}
    </div>
  );
}

const EMPTY_ORDERS: OrderCounts = { total: 0, pending: 0, approved: 0, rejected: 0, processing: 0 };

function ReportStat({
  icon: Icon,
  label,
  value,
  href,
  tone = "emerald",
}: {
  icon: typeof ClipboardList;
  label: string;
  value: number;
  href: string;
  tone?: "emerald" | "amber" | "rose" | "sky";
}) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-800",
    rose: "bg-rose-50 text-red-700",
    sky: "bg-sky-50 text-sky-800",
  }[tone];
  return (
    <Link href={href} className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-2 ring-1 ring-emerald-100 hover:ring-emerald-300">
      <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-sm font-semibold tabular-nums text-slate-900">{value}</p>
      </div>
    </Link>
  );
}

export function ListingOrdersReport({ listing, category }: { listing: AdminListing; category?: string }) {
  const [open, setOpen] = useState(false);
  const orders = listing.orders ?? EMPTY_ORDERS;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function href(bucket: "all" | "pending" | "approved" | "rejected" | "processing") {
    const search = new URLSearchParams();
    const base = orderBookingsHref(bucket, category).split("?")[1];
    if (base) {
      new URLSearchParams(base).forEach((value, key) => search.set(key, value));
    }
    search.set("listingId", listing.id);
    return `/admin/bookings?${search.toString()}`;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-7 cursor-pointer items-center rounded-md bg-emerald-50 px-2 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-100 hover:bg-emerald-100"
      >
        Orders report
      </button>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-center">
          <button type="button" className="absolute inset-0 bg-slate-900/40" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md rounded-t-2xl bg-[#f3f8f5] p-4 shadow-xl ring-1 ring-emerald-100 sm:rounded-2xl">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold text-slate-900">{listing.title}</p>
              <button type="button" onClick={() => setOpen(false)} className="text-xs font-medium text-slate-500 hover:text-slate-800">
                Close
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ReportStat icon={ClipboardList} label="Total orders" value={orders.total} href={href("all")} />
              <ReportStat icon={CalendarClock} label="Pending" value={orders.pending} href={href("pending")} tone="amber" />
              <ReportStat icon={CheckCircle2} label="Approved" value={orders.approved} href={href("approved")} />
              <ReportStat icon={Ban} label="Rejected" value={orders.rejected} href={href("rejected")} tone="rose" />
              <ReportStat icon={Wrench} label="Processing" value={orders.processing} href={href("processing")} tone="sky" />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function AdminListingCard({
  listing,
  actions,
  defaultOpen = false,
  sno,
  category,
}: {
  listing: AdminListing;
  actions?: ReactNode;
  defaultOpen?: boolean;
  sno?: number;
  category?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const owner = listing.ownerName || listing.vendor || "—";
  const mobile = listing.mobileNumber || "—";
  return (
    <>
      <tr className="bg-white hover:bg-emerald-50/40">
        <td className="whitespace-nowrap px-3 py-2 align-middle text-xs tabular-nums text-slate-500">{sno ?? ""}</td>
        <td className="px-3 py-2 align-middle">
          <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-100 ring-1 ring-emerald-100">
            <ListingThumb src={listing.image} categoryId={listing.categoryId || "jobs"} className="h-full w-full object-cover" />
          </div>
        </td>
        <td className="max-w-[16rem] px-3 py-2 align-middle">
          <p className="flex items-center gap-1.5 truncate text-sm font-medium text-slate-900">
            {listing.title}
            <StatusPill value={listing.status} />
          </p>
          {listing.priceLabel ? <p className="text-[11px] font-semibold text-emerald-700">{listing.priceLabel}</p> : null}
        </td>
        <td className="whitespace-nowrap px-3 py-2 align-middle text-sm text-slate-700">{mobile}</td>
        <td className="whitespace-nowrap px-3 py-2 align-middle text-sm text-slate-700">{owner}</td>
        <td className="whitespace-nowrap px-3 py-2 align-middle">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-7 cursor-pointer items-center rounded-md bg-white px-2 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            {open ? "Hide details" : "View details"}
          </button>
        </td>
        <td className="whitespace-nowrap px-3 py-2 align-middle">
          <ListingOrdersReport listing={listing} category={category} />
        </td>
        {actions ? <td className="whitespace-nowrap px-3 py-2 align-middle text-right">{actions}</td> : null}
      </tr>
      {open ? (
        <tr className="bg-slate-50/80">
          <td colSpan={actions ? 8 : 7} className="px-4 pb-4 pt-1 md:px-5">
            <AdminListingFields listing={listing} />
          </td>
        </tr>
      ) : null}
    </>
  );
}
