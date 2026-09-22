"use client";

import { useSearchParams } from "next/navigation";
import { AdminPeoplePanel } from "@/features/admin/people-panel";

const BUCKETS = [
  { id: "pending", label: "Pending" },
  { id: "active", label: "Active" },
  { id: "rejected", label: "Disabled" },
  { id: "blocked", label: "Blocked" },
];

export default function AdminVendorsPage() {
  const search = useSearchParams();
  const bucket = search.get("bucket") || "pending";
  const label = BUCKETS.find((b) => b.id === bucket)?.label ?? "Vendors";

  return <AdminPeoplePanel title={`${label} vendors`} bucket={bucket} empty={`No ${label.toLowerCase()} vendors.`} />;
}
