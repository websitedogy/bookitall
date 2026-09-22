"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { api } from "@/shared/lib/api";
import { useAdminAuth, isSuperAdmin } from "@/features/auth/store";
import { AdminCard, AdminHeader } from "@/features/admin/admin-shell";
import { EmptyState, ListingReviewActions, OrderPills, RowActions, StatusPill } from "@/features/admin/admin-ui";
import { AdminListingFields } from "@/features/admin/listing-detail-card";
import type { AdminListing, AdminUser } from "@/features/admin/types";
import { publicEmail } from "@/shared/lib/email";

export type AdminPerson = AdminUser & { listings?: AdminListing[] };

function VendorActions({
  user,
  busy,
  onStatus,
}: {
  user: AdminUser;
  busy: boolean;
  onStatus: (status: "ACTIVE" | "INACTIVE" | "SUSPENDED") => void;
}) {
  if (user.role === "SUPER_ADMIN") return null;
  const vendor = user.role !== "CUSTOMER";
  return (
    <RowActions
      items={[
        ...(vendor
          ? [
              { id: "enable", label: "Enable", disabled: busy || user.status === "ACTIVE", onClick: () => onStatus("ACTIVE"), tone: "primary" as const },
              { id: "disable", label: "Disable", disabled: busy || user.status === "INACTIVE", onClick: () => onStatus("INACTIVE") },
            ]
          : []),
        user.status !== "SUSPENDED"
          ? { id: "block", label: "Block", disabled: busy, onClick: () => onStatus("SUSPENDED"), tone: "danger" as const }
          : { id: "unblock", label: "Unblock", disabled: busy, onClick: () => onStatus("ACTIVE"), tone: "primary" as const },
      ]}
    />
  );
}

export function AdminPersonDetail({ id, backHref, backLabel }: { id: string; backHref: string; backLabel: string }) {
  const token = useAdminAuth((s) => s.accessToken);
  const canManage = isSuperAdmin(useAdminAuth((s) => s.user?.role));
  const router = useRouter();
  const [person, setPerson] = useState<AdminPerson | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [busyListing, setBusyListing] = useState("");
  const [note, setNote] = useState("");
  const [postTab, setPostTab] = useState<"accepted" | "rejected">("accepted");

  useEffect(() => {
    if (!token || !id) return;
    let live = true;
    setLoading(true);
    setError("");
    api<AdminPerson>(`/admin/users/${id}`, { token })
      .then((res) => {
        if (!live) return;
        setPerson(res.data ?? null);
      })
      .catch((err) => {
        if (!live) return;
        setPerson(null);
        setError(err instanceof Error ? err.message : "Could not load profile");
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [id, token]);

  async function reviewListing(listingId: string, action: "accept" | "reject") {
    if (!token) return;
    setBusyListing(listingId);
    try {
      await api(`/admin/listings/${listingId}/${action}`, { method: "PATCH", token });
      const res = await api<AdminPerson>(`/admin/users/${id}`, { token });
      setPerson(res.data ?? null);
      setNote(action === "accept" ? "Post accepted. Customers can see it now." : "Post rejected.");
    } finally {
      setBusyListing("");
    }
  }

  async function setStatus(status: "ACTIVE" | "INACTIVE" | "SUSPENDED") {
    if (!token) return;
    setBusy(true);
    try {
      await api(`/admin/users/${id}/status`, { method: "PATCH", token, body: JSON.stringify({ status }) });
      const res = await api<AdminPerson>(`/admin/users/${id}`, { token });
      setPerson(res.data ?? null);
      setNote(status === "ACTIVE" ? "Enabled." : status === "INACTIVE" ? "Disabled." : "Blocked.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="py-16 text-center text-sm text-slate-500">Loading profile…</p>;
  }

  if (error || !person) {
    return (
      <div>
        <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
        <AdminCard className="mt-4">
          <EmptyState>{error || "Profile not found."}</EmptyState>
        </AdminCard>
      </div>
    );
  }

  const listings = person.listings ?? [];
  const pendingPosts = listings.filter((row) => row.status === "PENDING");
  const acceptedPosts = listings.filter((row) => row.status === "ACCEPTED" || row.status === "HOLD");
  const rejectedPosts = listings.filter((row) => row.status === "REJECTED");
  const tabPosts = postTab === "accepted" ? acceptedPosts : rejectedPosts;
  const initials = person.fullName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const joined = person.createdAt
    ? new Date(person.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    : "—";
  const lastSeen = person.lastSeenAt
    ? new Date(person.lastSeenAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    : "—";

  return (
    <div>
      <button
        type="button"
        onClick={() => router.push(backHref)}
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </button>

      <AdminHeader
        title={person.fullName}
        action={canManage ? <VendorActions user={person} busy={busy} onStatus={setStatus} /> : undefined}
      />
      {note ? <p className="mb-3 text-xs font-medium text-emerald-700">{note}</p> : null}

      <AdminCard className="mb-6 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-emerald-50/60 text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Last seen</th>
                <th className="px-4 py-3">Listings</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                <td className="whitespace-nowrap px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-xs font-semibold text-emerald-700">
                      {initials}
                    </span>
                    <div>
                      <p className="font-medium text-slate-900">{person.fullName}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <StatusPill value={person.status} />
                        {person.partnerType ? <StatusPill value={person.partnerType} /> : null}
                        {person.isOnline ? <StatusPill value="ONLINE" /> : null}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">{person.role.replaceAll("_", " ")}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">{person.phone || "—"}</td>
                <td className="max-w-[12rem] truncate px-4 py-3.5 text-slate-700">{publicEmail(person.email) || "—"}</td>
                <td className="max-w-[10rem] truncate px-4 py-3.5 text-slate-700">{person.businessName || "—"}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">{joined}</td>
                <td className="whitespace-nowrap px-4 py-3.5 text-slate-700">{lastSeen}</td>
                <td className="px-4 py-3.5 text-slate-700">
                  <p>{listings.length}</p>
                  <p className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-slate-400">
                    <span>{pendingPosts.length} pending</span>
                    <span>{acceptedPosts.length} accepted</span>
                    <span>{rejectedPosts.length} rejected</span>
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AdminCard>

      {listings.length === 0 ? (
        <>
          <h2 className="mb-2.5 mt-1">
            <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
              Submitted posts
            </span>
          </h2>
          <AdminCard>
            <EmptyState>No posts submitted yet.</EmptyState>
          </AdminCard>
        </>
      ) : (
        <>
          {pendingPosts.length ? (
            <PostGroup
              title="Pending posts"
              listings={pendingPosts}
              busyListing={busyListing}
              onReview={reviewListing}
            />
          ) : null}
          <div className="mb-3 mt-1 flex gap-1.5">
            <PostTab
              active={postTab === "accepted"}
              count={acceptedPosts.length}
              onClick={() => setPostTab("accepted")}
            >
              Accepted
            </PostTab>
            <PostTab
              active={postTab === "rejected"}
              count={rejectedPosts.length}
              onClick={() => setPostTab("rejected")}
            >
              Rejected
            </PostTab>
          </div>
          <PostGroup
            title={postTab === "accepted" ? "Accepted posts" : "Rejected posts"}
            listings={tabPosts}
            hideTitle
            busyListing={busyListing}
            onReview={reviewListing}
          />
        </>
      )}
    </div>
  );
}

function PostTab({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean;
  count: number;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ${
        active ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
      }`}
    >
      {children}
      <span className={`tabular-nums ${active ? "text-white/80" : "text-emerald-700"}`}>{count}</span>
    </button>
  );
}

function PostGroup({
  title,
  listings,
  hideTitle,
  busyListing,
  onReview,
}: {
  title: string;
  listings: AdminListing[];
  hideTitle?: boolean;
  busyListing: string;
  onReview: (id: string, action: "accept" | "reject") => void;
}) {
  return (
    <div className="mb-6">
      {hideTitle ? null : (
        <h2 className="mb-2.5 mt-1">
          <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
            {title}
          </span>
        </h2>
      )}
      {listings.length === 0 ? (
        <AdminCard>
          <EmptyState>No {title.toLowerCase()}.</EmptyState>
        </AdminCard>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <AdminCard key={listing.id} className="p-5">
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-base font-semibold text-slate-900">
                    {listing.title}
                    <StatusPill value={listing.status} />
                    {listing.priceLabel ? <span className="text-sm font-semibold text-emerald-700">{listing.priceLabel}</span> : null}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {[listing.category, listing.location, listing.mobileNumber].filter(Boolean).join(" · ")}
                  </p>
                  <div className="mt-2">
                    <OrderPills orders={listing.orders} />
                  </div>
                </div>
                <ListingReviewActions
                  status={listing.status}
                  busy={busyListing === listing.id}
                  onAccept={() => onReview(listing.id, "accept")}
                  onReject={() => onReview(listing.id, "reject")}
                />
              </div>
              <AdminListingFields listing={listing} />
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}
