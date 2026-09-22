"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AdminHeader } from "@/features/admin/admin-shell";
import { AdminBookingsPanel } from "@/features/admin/bookings-panel";
import { FilterDropdown } from "@/features/admin/admin-ui";
import { SERVICE_NAV } from "@/features/home/service-nav";

const BUCKETS = [
  { id: "all", label: "All orders" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "working", label: "Processing" },
  { id: "worked", label: "Worked" },
  { id: "scheduled", label: "Scheduled" },
];

export default function AdminBookingsPage() {
  const search = useSearchParams();
  const router = useRouter();
  const bucket = search.get("bucket") || "all";
  const category = search.get("category") || "";
  const listingId = search.get("listingId") || "";
  const catName = SERVICE_NAV.find((s) => s.id === category)?.name;
  const titles: Record<string, string> = {
    all: "Orders",
    pending: "Pending orders",
    approved: "Approved orders",
    rejected: "Rejected orders",
    working: "Processing orders",
    processing: "Processing orders",
    worked: "Worked list",
    scheduled: "Schedule bookings",
  };

  function go(nextBucket: string) {
    const params = new URLSearchParams();
    if (nextBucket !== "all") params.set("bucket", nextBucket);
    if (category) params.set("category", category);
    if (listingId) params.set("listingId", listingId);
    const qs = params.toString();
    router.replace(qs ? `/admin/bookings?${qs}` : "/admin/bookings");
  }

  return (
    <div>
      <AdminHeader
        title={[catName, titles[bucket] ?? "Orders"].filter(Boolean).join(" · ")}
        action={<FilterDropdown value={bucket === "processing" ? "working" : bucket} options={BUCKETS} onChange={go} />}
      />
      <AdminBookingsPanel
        bucket={bucket === "all" ? undefined : bucket}
        category={category || undefined}
        listingId={listingId || undefined}
        empty="No orders in this list."
      />
    </div>
  );
}
