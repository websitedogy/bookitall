"use client";

import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Flag, Star, X } from "lucide-react";
import { useAuth } from "@/features/auth/store";
import { api } from "@/shared/lib/api";
import { cn } from "@/shared/lib/cn";
import {
  DETAIL_TAB_ORDER,
  detailTabNames,
  groupDetailRows,
  tourRouteStops,
  type DetailTabId,
  type ListingDetailRow,
} from "./listing-tab-groups";
import { TourRouteTracker } from "./tour-route-tracker";

const REPORT_REASONS = [
  "Fake or misleading",
  "Wrong photos",
  "Wrong price or details",
  "Inappropriate",
  "Spam",
  "Other",
] as const;

type ActionId = "reviews" | "report";

export function ListingInfoTabs({
  listingId,
  listingTitle,
  categoryId,
  location,
  description,
  rows,
  reviewCount = 0,
  children,
}: {
  listingId: string;
  listingTitle: string;
  categoryId: string;
  location?: string;
  description?: string;
  rows: ListingDetailRow[];
  reviewCount?: number;
  children?: ReactNode;
}) {
  const names = detailTabNames(categoryId);
  const grouped = useMemo(() => {
    const next = groupDetailRows(rows);
    if (location?.trim() && !next.location.some((row) => row.value.trim().toLowerCase() === location.trim().toLowerCase())) {
      next.location.unshift({ key: "location", label: "Location", value: location.trim() });
    }
    if (description?.trim() && !next.extra.some((row) => row.key === "description")) {
      next.extra.unshift({ key: "description", label: "About", value: description.trim() });
    }
    return next;
  }, [rows, location, description]);

  const tabs = DETAIL_TAB_ORDER.filter((id) => grouped[id].length > 0);
  const [tab, setTab] = useState<DetailTabId>(tabs[0] ?? "basics");
  const [action, setAction] = useState<ActionId | null>(null);
  const activeTab = tabs.includes(tab) ? tab : (tabs[0] ?? "basics");

  return (
    <>
      <div className="flex flex-wrap gap-2 px-5 pb-4">
        <ActionBadge
          active={action === "reviews"}
          onClick={() => setAction("reviews")}
          icon={<Star className="h-3 w-3" aria-hidden />}
          label="Reviews"
          badge={String(reviewCount)}
        />
        <ActionBadge
          active={action === "report"}
          onClick={() => setAction("report")}
          icon={<Flag className="h-3 w-3" aria-hidden />}
          label="Report"
          alert
        />
      </div>

      <div className="border-t border-[#efe6d4] p-5">
        {children}
        <div className="mt-5">
          {tabs.length ? (
            <>
              <div role="tablist" aria-label="Listing details" className="no-scrollbar flex gap-1 overflow-x-auto rounded-full bg-[#f4efe4] p-1">
                {tabs.map((id) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === id}
                    onClick={() => setTab(id)}
                    className={cn(
                      "h-9 shrink-0 rounded-full px-3.5 text-[12px] font-semibold",
                      activeTab === id ? "bg-white text-[#0f3d38] shadow-[0_4px_12px_-8px_rgba(7,22,20,0.45)]" : "text-[#7a6a52]",
                    )}
                  >
                    {names[id]}
                  </button>
                ))}
              </div>
              {activeTab === "destinations" && tourRouteStops(grouped.destinations).length ? (
                <TourRouteTracker rows={grouped.destinations} />
              ) : (
                <DetailRows rows={grouped[activeTab]} />
              )}
            </>
          ) : (
            <p className="text-sm text-[#7a6a52]">No extra details for this listing yet.</p>
          )}
        </div>
      </div>

      {action === "reviews" ? (
        <BootstrapModal title="Reviews" onClose={() => setAction(null)}>
          <ReviewsPanel count={reviewCount} />
        </BootstrapModal>
      ) : null}
      {action === "report" ? (
        <BootstrapModal title="Report listing" onClose={() => setAction(null)}>
          <ReportPanel listingId={listingId} listingTitle={listingTitle} />
        </BootstrapModal>
      ) : null}
    </>
  );
}

function BootstrapModal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="listing-modal-title"
        className="relative z-10 flex max-h-[min(86vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-[0_24px_80px_-24px_rgba(15,23,42,0.45)]"
      >
        <div className="flex items-center justify-between border-b border-[#eadfcd] px-4 py-3">
          <h3 id="listing-modal-title" className="text-base font-semibold text-[#12241f]">
            {title}
          </h3>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#5b6e68] hover:bg-[#f4efe4]"
          >
            <X className="h-4 w-4" strokeWidth={2.2} />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

function ActionBadge({
  active,
  onClick,
  icon,
  label,
  badge,
  alert,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  badge?: string;
  alert?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-semibold",
        active ? "bg-[#0f3d38] text-white" : "bg-[#f4efe4] text-[#5b6e68]",
      )}
    >
      {icon}
      {label}
      {badge != null ? (
        <span className={cn("inline-flex min-w-[1.1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold", active ? "bg-white/20 text-white" : "bg-white text-[#0f3d38]")}>
          {badge}
        </span>
      ) : null}
      {alert ? <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-[#fca5a5]" : "bg-[#dc2626]")} /> : null}
    </button>
  );
}

function DetailRows({ rows }: { rows: ListingDetailRow[] }) {
  if (!rows.length) {
    return <p className="mt-4 text-sm text-[#7a6a52]">Nothing listed here yet.</p>;
  }
  return (
    <dl className="mt-3 divide-y divide-[#efe6d4]">
      {rows.map((item) => (
        <div key={`${item.key}-${item.label}`} className="flex justify-between gap-4 py-3 text-sm">
          <dt className="shrink-0 text-[#7a6a52]">{item.label}</dt>
          <dd className="max-w-[65%] whitespace-pre-wrap text-right font-medium text-[#12241f]">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ReviewsPanel({ count }: { count: number }) {
  return (
    <div className="rounded-2xl bg-[#f7f3ea] px-4 py-6 text-center">
      <div className="flex justify-center gap-0.5" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-4 w-4 text-[#eadfcd]" strokeWidth={2} />
        ))}
      </div>
      <p className="mt-3 text-sm font-semibold text-[#12241f]">{count ? `${count} reviews` : "No reviews yet"}</p>
      <p className="mt-1 text-[13px] leading-5 text-[#7a6a52]">Ratings show here after a completed booking.</p>
    </div>
  );
}

function ReportPanel({ listingId, listingTitle }: { listingId: string; listingTitle: string }) {
  const user = useAuth((s) => s.user);
  const [reason, setReason] = useState<(typeof REPORT_REASONS)[number]>(REPORT_REASONS[0]);
  const [message, setMessage] = useState("");
  const [name, setName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const who = (user?.fullName || name).trim();
      const mobile = (user?.phone || phone).replace(/\D/g, "").slice(0, 10);
      if (who.length < 2) throw new Error("Add your name.");
      if (!user && mobile.length !== 10) throw new Error("Add a 10-digit mobile number.");
      await api("/support/tickets", {
        method: "POST",
        body: JSON.stringify({
          name: who,
          phone: mobile || user?.phone || "",
          email: user?.email || "",
          topic: "Listing report",
          subject: `${reason} · ${listingTitle}`.slice(0, 180),
          message: `${message.trim()}\n\nListing: ${listingTitle}\nID: ${listingId}`,
          bookingRef: listingId.slice(0, 64),
        }),
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send report.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl bg-[#f7f3ea] px-4 py-6 text-center">
        <p className="text-sm font-semibold text-[#12241f]">Report sent</p>
        <p className="mt-1 text-[13px] leading-5 text-[#7a6a52]">Support will check this listing from the Hyderabad desk.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <p className="text-[13px] leading-5 text-[#7a6a52]">Tell us what is wrong. This goes to Book It All support, not the vendor.</p>
      <div className="flex flex-wrap gap-1.5">
        {REPORT_REASONS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setReason(item)}
            className={cn(
              "rounded-full px-3 py-1.5 text-[12px] font-semibold",
              reason === item ? "bg-[#0f3d38] text-white" : "bg-[#f4efe4] text-[#5b6e68]",
            )}
          >
            {item}
          </button>
        ))}
      </div>
      {!user ? (
        <div className="grid grid-cols-2 gap-2">
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={reportInput} />
          <input
            required
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="Mobile"
            className={reportInput}
          />
        </div>
      ) : null}
      <textarea
        required
        minLength={8}
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Describe the issue"
        className={`${reportInput} resize-none`}
      />
      {error ? <p className="text-sm text-[var(--error)]">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="inline-flex h-10 w-full items-center justify-center rounded-full bg-[#0f3d38] text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Sending…" : "Submit report"}
      </button>
    </form>
  );
}

const reportInput =
  "w-full rounded-xl border-0 bg-[#f6f1e8] px-3 py-2.5 text-sm text-[#12241f] outline-none ring-1 ring-[#eadfcd] placeholder:text-[#a89880] focus:bg-white focus:ring-[#0f766e]";
