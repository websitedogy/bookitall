"use client";

import { useEffect, useState } from "react";
import { Ban, CheckCircle2, ClipboardList, History, Wallet, Wrench } from "lucide-react";
import { api } from "@/shared/lib/api";
import { inr } from "@/shared/lib/format";
import { useAdminAuth } from "@/features/auth/store";
import type { VendorReport } from "@/features/admin/types";

const empty: VendorReport = {
  name: "",
  orders: { total: 0, accepted: 0, rejected: 0, working: 0 },
  wallet: { available: "0", pending: "0" },
  history: [],
};

function Stat({
  icon: Icon,
  label,
  value,
  tone = "emerald",
}: {
  icon: typeof Wallet;
  label: string;
  value: string | number;
  tone?: "emerald" | "amber" | "rose" | "sky";
}) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-800",
    rose: "bg-rose-50 text-red-700",
    sky: "bg-sky-50 text-sky-800",
  }[tone];
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-2 ring-1 ring-emerald-100">
      <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-sm font-semibold tabular-nums text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function num(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function VendorReportButton({ userId, name }: { userId: string; name: string }) {
  const token = useAdminAuth((s) => s.accessToken);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<VendorReport>(empty);

  useEffect(() => {
    if (!open || !token) return;
    let live = true;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setLoading(true);
    setError("");
    api<VendorReport>(`/admin/users/${userId}/report`, { token })
      .then((res) => {
        if (!live) return;
        const data = res.data;
        setReport({
          name: data?.name || name,
          orders: {
            total: num(data?.orders?.total),
            accepted: num(data?.orders?.accepted),
            rejected: num(data?.orders?.rejected),
            working: num(data?.orders?.working),
          },
          wallet: {
            available: String(data?.wallet?.available ?? "0"),
            pending: String(data?.wallet?.pending ?? "0"),
          },
          history: Array.isArray(data?.history) ? data.history : [],
        });
      })
      .catch((err) => {
        if (!live) return;
        setError(err instanceof Error ? err.message : "Could not load report");
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      live = false;
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, token, userId, name]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-7 cursor-pointer items-center rounded-md bg-emerald-50 px-2 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-100 hover:bg-emerald-100"
      >
        Report
      </button>
      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-center">
          <button type="button" className="absolute inset-0 bg-slate-900/40" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md rounded-t-2xl bg-[#f3f8f5] p-4 shadow-xl ring-1 ring-emerald-100 sm:rounded-2xl">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-emerald-200 sm:hidden" />
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold text-slate-900">{report.name || name}</p>
              <button type="button" onClick={() => setOpen(false)} className="text-xs font-medium text-slate-500 hover:text-slate-800">
                Close
              </button>
            </div>
            {loading ? (
              <p className="py-8 text-center text-sm text-slate-500">Loading live report…</p>
            ) : error ? (
              <p className="py-8 text-center text-sm text-red-600">{error}</p>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Stat icon={ClipboardList} label="Total orders" value={report.orders.total} />
                  <Stat icon={CheckCircle2} label="Accepted" value={report.orders.accepted} />
                  <Stat icon={Ban} label="Rejected" value={report.orders.rejected} tone="rose" />
                  <Stat icon={Wrench} label="On working" value={report.orders.working} tone="sky" />
                  <Stat icon={Wallet} label="Wallet" value={inr(report.wallet.available)} />
                  <Stat icon={History} label="Pending wallet" value={inr(report.wallet.pending)} tone="amber" />
                </div>
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                    <History className="h-3.5 w-3.5" />
                    Wallet history
                  </p>
                  {report.history.length === 0 ? (
                    <p className="rounded-xl bg-white px-3 py-4 text-center text-xs text-slate-500 ring-1 ring-emerald-100">No wallet history yet.</p>
                  ) : (
                    <ul className="max-h-40 space-y-1 overflow-y-auto">
                      {report.history.map((row) => (
                        <li key={row.id} className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-1.5 ring-1 ring-emerald-100">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium text-slate-800">{row.reason.replaceAll("_", " ")}</p>
                            <p className="text-[10px] text-slate-400">
                              {row.note ? `${row.note} · ` : ""}
                              {new Date(row.createdAt).toLocaleString("en-IN")}
                            </p>
                          </div>
                          <p className={`shrink-0 text-xs font-semibold ${row.type === "CREDIT" ? "text-emerald-700" : "text-red-600"}`}>
                            {row.type === "CREDIT" ? "+" : "-"}
                            {inr(row.amount)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
