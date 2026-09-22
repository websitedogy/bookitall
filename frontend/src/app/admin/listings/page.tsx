"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/shared/lib/api";
import { useAdminAuth } from "@/features/auth/store";
import { AdminCard, AdminHeader } from "@/features/admin/admin-shell";
import { CompactPager, EmptyState, ListingReviewActions, OrderStatGrid, sumOrderCounts } from "@/features/admin/admin-ui";
import { AdminListingCard } from "@/features/admin/listing-detail-card";
import { qs, rowLimit, useAdminList } from "@/features/admin/use-admin-list";
import type { AdminListing } from "@/features/admin/types";
import { SERVICE_NAV } from "@/features/home/service-nav";

export default function AdminListingsPage() {
  const token = useAdminAuth((s) => s.accessToken);
  const search = useSearchParams();
  const category = search.get("category") || "all";
  const owner = search.get("owner") || undefined;
  const status = search.get("status") || (owner === "active" ? "ACCEPTED" : category === "all" ? "PENDING" : "all");
  const [busyId, setBusyId] = useState("");
  const [page, setPage] = useState(1);
  const [rowsKey, setRowsKey] = useState("50");
  const limit = rowLimit(rowsKey);
  const path = `/admin/listings${qs({
    status: status === "all" ? undefined : status,
    category: category === "all" ? undefined : category,
    owner,
  })}`;
  const { rows, loading, error, reload } = useAdminList<AdminListing>(path);

  useEffect(() => {
    setPage(1);
  }, [status, category, owner, rowsKey]);

  async function act(id: string, action: "accept" | "reject") {
    if (!token) return;
    setBusyId(id);
    try {
      await api(`/admin/listings/${id}/${action}`, { method: "PATCH", token });
      await reload(true);
    } finally {
      setBusyId("");
    }
  }

  const catName = SERVICE_NAV.find((s) => s.id === category)?.name;
  const paged = useMemo(() => rows.slice((page - 1) * limit, page * limit), [rows, page, limit]);
  const orderCounts = useMemo(() => sumOrderCounts(rows), [rows]);
  const categoryFilter = category !== "all" ? category : undefined;
  const nameLabel = category === "hotels" ? "Hotel name" : category === "tours" ? "Tour name" : "Name";
  const mobileLabel = category === "hotels" ? "Hotel mobile no" : "Mobile no";
  const ownerLabel = category === "hotels" ? "Hotel owner" : "Owner";
  const pageTitle = status === "REJECTED" ? "Rejected posts" : catName ? `${catName} posts` : "Pending posts";

  return (
    <div>
      <AdminHeader title={pageTitle} />
      <div className="mb-2.5">
        <OrderStatGrid counts={orderCounts} category={categoryFilter} />
      </div>
      <AdminCard className="overflow-hidden p-0">
        {loading ? (
          <EmptyState>Loading…</EmptyState>
        ) : error ? (
          <EmptyState>{error}</EmptyState>
        ) : rows.length === 0 ? (
          <EmptyState>No listings in this list.</EmptyState>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="min-w-[52rem] w-full text-left text-sm">
                <thead className="bg-emerald-50/60 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                  <tr>
                    <th className="w-12 whitespace-nowrap px-3 py-2">S.no</th>
                    <th className="w-14 whitespace-nowrap px-3 py-2">Photo</th>
                    <th className="whitespace-nowrap px-3 py-2">{nameLabel}</th>
                    <th className="whitespace-nowrap px-3 py-2">{mobileLabel}</th>
                    <th className="whitespace-nowrap px-3 py-2">{ownerLabel}</th>
                    <th className="whitespace-nowrap px-3 py-2">Details</th>
                    <th className="whitespace-nowrap px-3 py-2">Orders report</th>
                    <th className="whitespace-nowrap px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paged.map((row, index) => (
                    <AdminListingCard
                      key={row.id}
                      sno={(page - 1) * limit + index + 1}
                      listing={row}
                      category={categoryFilter}
                      actions={
                        <ListingReviewActions
                          status={row.status}
                          busy={busyId === row.id}
                          onAccept={() => void act(row.id, "accept")}
                          onReject={() => void act(row.id, "reject")}
                        />
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <CompactPager page={page} total={rows.length} limit={limit} rows={rowsKey} onPage={setPage} onRows={setRowsKey} />
          </div>
        )}
      </AdminCard>
    </div>
  );
}
