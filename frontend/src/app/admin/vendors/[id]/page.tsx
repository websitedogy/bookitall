"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AdminPersonDetail } from "@/features/admin/person-detail";

function VendorDetailInner() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const search = useSearchParams();
  const from = search.get("from");
  const fromUsers = from === "users-customers" || from === "users-vendors" || from === "registered";
  const backHref = fromUsers
    ? `/admin/users?tab=${from === "users-customers" ? "customers" : "vendors"}`
    : from
      ? `/admin/vendors?bucket=${from}`
      : "/admin/vendors?bucket=active";
  const backLabel = fromUsers ? "Back to users" : "Back to vendors";

  if (!id) {
    return <p className="py-16 text-center text-sm text-slate-500">Vendor not found.</p>;
  }

  return <AdminPersonDetail id={id} backHref={backHref} backLabel={backLabel} />;
}

export default function AdminVendorDetailPage() {
  return (
    <Suspense fallback={<p className="py-16 text-center text-sm text-slate-500">Loading vendor…</p>}>
      <VendorDetailInner />
    </Suspense>
  );
}
