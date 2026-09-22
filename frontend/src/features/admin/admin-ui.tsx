"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Ban, CalendarClock, CheckCircle2, ChevronDown, ClipboardList, Wrench, type LucideIcon } from "lucide-react";
import type { OrderCounts } from "@/features/admin/types";

export function DashBox({
  href,
  label,
  count,
  icon: Icon,
}: {
  href: string;
  label: string;
  count: number | string;
  hint?: string;
  icon?: LucideIcon;
  tone?: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[5.75rem] flex-col justify-between rounded-xl bg-white p-3 shadow-sm ring-1 ring-emerald-100 transition hover:-translate-y-0.5 hover:ring-emerald-300"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold leading-4 text-slate-600">{label}</p>
        {Icon ? (
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
            <Icon className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </div>
      <p className="text-xl font-semibold tracking-tight text-slate-900">{count}</p>
    </Link>
  );
}

const EMPTY_ORDERS: OrderCounts = { total: 0, pending: 0, approved: 0, rejected: 0, processing: 0 };

export function sumOrderCounts(rows: { orders?: OrderCounts }[]) {
  return rows.reduce(
    (acc, row) => ({
      total: acc.total + (row.orders?.total ?? 0),
      pending: acc.pending + (row.orders?.pending ?? 0),
      approved: acc.approved + (row.orders?.approved ?? 0),
      rejected: acc.rejected + (row.orders?.rejected ?? 0),
      processing: acc.processing + (row.orders?.processing ?? 0),
    }),
    { ...EMPTY_ORDERS },
  );
}

export function orderBookingsHref(bucket: "all" | "pending" | "approved" | "rejected" | "processing", category?: string) {
  const params = new URLSearchParams();
  if (bucket !== "all") params.set("bucket", bucket === "processing" ? "working" : bucket);
  if (category && category !== "all") params.set("category", category);
  const qs = params.toString();
  return qs ? `/admin/bookings?${qs}` : "/admin/bookings";
}

export function OrderStatGrid({
  counts,
  category,
}: {
  counts?: OrderCounts | null;
  category?: string;
}) {
  const value = counts ?? EMPTY_ORDERS;
  const items = [
    { id: "all" as const, label: "Total orders", count: value.total, icon: ClipboardList },
    { id: "pending" as const, label: "Pending orders", count: value.pending, icon: CalendarClock },
    { id: "approved" as const, label: "Approved", count: value.approved, icon: CheckCircle2 },
    { id: "rejected" as const, label: "Rejected", count: value.rejected, icon: Ban },
    { id: "processing" as const, label: "Processing", count: value.processing, icon: Wrench },
  ];
  return (
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-5">
      {items.map((item) => (
        <DashBox key={item.id} href={orderBookingsHref(item.id, category)} label={item.label} count={item.count} icon={item.icon} />
      ))}
    </div>
  );
}

export function OrderPills({
  orders,
  compact = false,
}: {
  orders?: OrderCounts | null;
  compact?: boolean;
}) {
  const value = orders ?? EMPTY_ORDERS;
  const all = [
    { label: "Orders", count: value.total, cls: "bg-slate-100 text-slate-700", always: true },
    { label: "Pending", count: value.pending, cls: "bg-amber-50 text-amber-700", always: false },
    { label: "Approved", count: value.approved, cls: "bg-emerald-50 text-emerald-700", always: false },
    { label: "Rejected", count: value.rejected, cls: "bg-red-50 text-red-700", always: false },
    { label: "Processing", count: value.processing, cls: "bg-sky-50 text-sky-700", always: false },
  ];
  const items = compact ? [all[0]] : all.filter((item) => item.always || item.count > 0);
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {items.map((item) => (
        <span key={item.label} className={`inline-flex items-center gap-1 rounded-full px-1.5 py-px text-[10px] font-semibold ${item.cls}`}>
          <span className="tabular-nums">{item.count}</span>
          {item.label}
        </span>
      ))}
    </span>
  );
}

export function FilterDropdown({
  value,
  options,
  onChange,
  className = "",
}: {
  value: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((option) => option.id === value)?.label ?? "Status";

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-7 max-w-[7.5rem] cursor-pointer items-center gap-1 rounded-md bg-emerald-600 px-2 text-[11px] font-semibold text-white shadow-sm hover:bg-emerald-500"
      >
        <span className="truncate">{current}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="absolute right-0 z-40 mt-1 min-w-[7.5rem] overflow-hidden rounded-md bg-white py-1 shadow-lg ring-1 ring-emerald-100">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                onChange(option.id);
                setOpen(false);
              }}
              className={`block w-full cursor-pointer px-3 py-1.5 text-left text-xs font-medium ${
                value === option.id ? "bg-emerald-50 text-emerald-800" : "text-slate-700 hover:bg-emerald-50/80"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function RowActions({
  items,
  label = "Actions",
}: {
  items: { id: string; label: string; onClick: () => void; tone?: "default" | "danger" | "primary"; disabled?: boolean }[];
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const choices = items.filter((item) => item.id !== "view");

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

  if (choices.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md bg-emerald-600 px-2 text-[11px] font-semibold text-white hover:bg-emerald-500"
      >
        {label}
        <ChevronDown className="h-3.5 w-3.5 shrink-0" />
      </button>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-center">
          <button type="button" className="absolute inset-0 bg-slate-900/40" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-sm rounded-t-2xl bg-white p-3 shadow-xl ring-1 ring-emerald-100 sm:rounded-2xl">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-emerald-100 sm:hidden" />
            <p className="mb-2 text-xs font-semibold text-slate-900">Actions</p>
            <div className="grid gap-1.5">
              {choices.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    if (item.disabled) return;
                    item.onClick();
                    setOpen(false);
                  }}
                  className={`h-10 cursor-pointer rounded-lg text-sm font-semibold disabled:cursor-default disabled:opacity-40 ${
                    item.tone === "danger"
                      ? "bg-red-50 text-red-700 hover:bg-red-100"
                      : item.tone === "primary"
                        ? "bg-emerald-600 text-white hover:bg-emerald-500"
                        : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-10 cursor-pointer rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

const SHORT_STATUS: Record<string, string> = {
  PENDING_VERIFICATION: "Pending",
  PENDING: "Pending",
  INACTIVE: "Off",
  DISABLED: "Off",
  ACTIVE: "Active",
  SUSPENDED: "Blocked",
  BLOCKED: "Blocked",
  REJECTED: "Rejected",
  ACCEPTED: "Live",
  HOLD: "Hold",
  VERIFIED: "Ok",
  SUCCESS: "Paid",
  PAID: "Paid",
  COMPLETED: "Done",
  RESOLVED: "Done",
  CONFIRMED: "Ok",
  AWAITING_PAYMENT: "Unpaid",
  IN_PROGRESS: "Work",
  ASSIGNED: "Work",
  OPEN: "Open",
  CANCELLED: "Cancel",
  FAILED: "Fail",
};

export function StatusPill({ value }: { value: string }) {
  const key = value.toUpperCase();
  const label = SHORT_STATUS[key] ?? value.replaceAll("_", " ");
  const good = ["ACTIVE", "VERIFIED", "SUCCESS", "PAID", "ACCEPTED", "COMPLETED", "RESOLVED", "CONFIRMED"];
  const wait = ["HOLD", "PENDING", "PENDING_VERIFICATION", "AWAITING_PAYMENT", "OPEN", "IN_PROGRESS", "ASSIGNED"];
  const bad = ["REJECTED", "SUSPENDED", "CANCELLED", "FAILED", "BLOCKED", "INACTIVE", "DISABLED"];
  const cls = good.includes(key)
    ? "bg-emerald-50 text-emerald-700"
    : wait.includes(key) || key.includes("PENDING") || key.includes("AWAITING")
      ? "bg-amber-50 text-amber-700"
      : bad.includes(key) || key.includes("REJECT") || key.includes("SUSPEND") || key.includes("CANCEL")
        ? "bg-red-50 text-red-700"
        : "bg-slate-100 text-slate-600";
  return <span className={`inline-flex rounded px-1.5 py-px text-[9px] font-semibold uppercase ${cls}`}>{label}</span>;
}

export function CompactPager({
  page,
  total,
  limit,
  rows,
  onPage,
  onRows,
}: {
  page: number;
  total: number;
  limit: number;
  rows: string;
  onPage: (page: number) => void;
  onRows: (rows: string) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / Math.max(limit, 1)));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return (
    <div className="flex items-center justify-between gap-2 border-t border-emerald-100 px-3 py-1.5 text-[11px] text-slate-500">
      <label className="inline-flex items-center gap-1.5">
        <span>Rows</span>
        <select
          value={rows}
          onChange={(event) => onRows(event.target.value)}
          className="h-6 cursor-pointer rounded-md border-0 bg-emerald-50 px-1.5 text-[11px] font-semibold text-emerald-800 outline-none"
        >
          <option value="50">50</option>
          <option value="100">100</option>
          <option value="250">250</option>
          <option value="500">500</option>
          <option value="1000">1000</option>
          <option value="all">All</option>
        </select>
      </label>
      <div className="flex items-center gap-1.5">
        <span>
          {from}–{to} / {total}
        </span>
        <button
          type="button"
          disabled={page <= 1}
          title="Previous page"
          onClick={() => onPage(page - 1)}
          className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-md ring-1 ring-emerald-100 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ‹
        </button>
        <button
          type="button"
          disabled={page >= pages}
          title="Next page"
          onClick={() => onPage(page + 1)}
          className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-md ring-1 ring-emerald-100 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ›
        </button>
      </div>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="px-4 py-8 text-center text-sm text-slate-500">{children}</p>;
}

export function ActionBtn({
  children,
  onClick,
  tone = "default",
  disabled,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  tone?: "default" | "primary" | "danger" | "reject";
  disabled?: boolean;
  title?: string;
}) {
  const cls =
    tone === "primary"
      ? "bg-emerald-600 text-white hover:bg-emerald-500"
      : tone === "reject"
        ? "bg-red-600 text-white hover:bg-red-500"
      : tone === "danger"
        ? "bg-white text-red-700 ring-1 ring-red-200 hover:bg-red-50 hover:ring-red-300"
        : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 hover:ring-slate-300";
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={`cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${cls}`}
    >
      {children}
    </button>
  );
}

export function ListingReviewActions({
  status,
  busy,
  onAccept,
  onReject,
}: {
  status: string;
  busy?: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  const key = status.toUpperCase();
  return (
    <RowActions
      items={[
        ...(key !== "ACCEPTED" && key !== "HOLD"
          ? [{ id: "accept", label: "Accept", disabled: busy, onClick: onAccept, tone: "primary" as const }]
          : []),
        ...(key !== "REJECTED" ? [{ id: "reject", label: "Reject", disabled: busy, onClick: onReject, tone: "danger" as const }] : []),
      ]}
    />
  );
}

export function VendorEnableToggle({
  status,
  busy,
  onEnable,
  onDisable,
}: {
  status: string;
  busy?: boolean;
  onEnable: () => void;
  onDisable: () => void;
}) {
  const enabled = status === "ACTIVE";
  const disabled = status === "INACTIVE";
  return (
    <div className="inline-flex overflow-hidden rounded-md ring-1 ring-slate-200">
      <button
        type="button"
        disabled={busy || enabled}
        title={enabled ? "Vendor is enabled" : "Enable vendor — services go live again"}
        onClick={onEnable}
        className={`cursor-pointer px-2.5 py-1 text-[11px] font-semibold transition disabled:cursor-default ${
          enabled ? "bg-emerald-600 text-white" : "bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
        }`}
      >
        Enable
      </button>
      <button
        type="button"
        disabled={busy || disabled}
        title={disabled ? "Vendor is disabled" : "Disable vendor — hide services from customers"}
        onClick={onDisable}
        className={`cursor-pointer px-2.5 py-1 text-[11px] font-semibold transition disabled:cursor-default ${
          disabled ? "bg-amber-500 text-white" : "bg-white text-slate-600 hover:bg-amber-50 hover:text-amber-800"
        }`}
      >
        Disable
      </button>
    </div>
  );
}
