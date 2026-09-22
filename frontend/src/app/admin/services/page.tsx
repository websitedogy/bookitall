"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/shared/lib/api";
import { useAdminAuth } from "@/features/auth/store";
import { AdminHeader } from "@/features/admin/admin-shell";
import { CategoryArt } from "@/features/home/components/category-art";
import { SERVICE_NAV } from "@/features/home/service-nav";
import { useServiceCatalog } from "@/features/services/service-catalog-provider";
import type { PlatformService } from "@/features/services/types";

const BADGES: Record<string, { box: string; badge: string; ring: string }> = {
  hotels: { box: "bg-sky-50", badge: "bg-sky-100 text-sky-700", ring: "ring-sky-200" },
  tours: { box: "bg-violet-50", badge: "bg-violet-100 text-violet-700", ring: "ring-violet-200" },
  cabs: { box: "bg-amber-50", badge: "bg-amber-100 text-amber-800", ring: "ring-amber-200" },
  electrician: { box: "bg-yellow-50", badge: "bg-yellow-100 text-yellow-800", ring: "ring-yellow-200" },
  plumber: { box: "bg-cyan-50", badge: "bg-cyan-100 text-cyan-800", ring: "ring-cyan-200" },
  ac: { box: "bg-blue-50", badge: "bg-blue-100 text-blue-700", ring: "ring-blue-200" },
  cleaning: { box: "bg-teal-50", badge: "bg-teal-100 text-teal-800", ring: "ring-teal-200" },
  jobs: { box: "bg-indigo-50", badge: "bg-indigo-100 text-indigo-700", ring: "ring-indigo-200" },
  beautician: { box: "bg-pink-50", badge: "bg-pink-100 text-pink-700", ring: "ring-pink-200" },
  painting: { box: "bg-orange-50", badge: "bg-orange-100 text-orange-800", ring: "ring-orange-200" },
  carpenter: { box: "bg-stone-50", badge: "bg-stone-200 text-stone-800", ring: "ring-stone-200" },
  appliance: { box: "bg-lime-50", badge: "bg-lime-100 text-lime-800", ring: "ring-lime-200" },
  "public-transport": { box: "bg-emerald-50", badge: "bg-emerald-100 text-emerald-800", ring: "ring-emerald-200" },
  "goods-transport": { box: "bg-rose-50", badge: "bg-rose-100 text-rose-700", ring: "ring-rose-200" },
  "packers-movers": { box: "bg-fuchsia-50", badge: "bg-fuchsia-100 text-fuchsia-700", ring: "ring-fuchsia-200" },
  "cloud-kitchen": { box: "bg-red-50", badge: "bg-red-100 text-red-700", ring: "ring-red-200" },
};

const FALLBACK: PlatformService[] = SERVICE_NAV.map((item) => ({
  id: item.id,
  name: item.name,
  slug: item.id,
  icon: `/categories/${item.id}.png`,
  isEnabled: true,
}));

export default function AdminServicesPage() {
  const token = useAdminAuth((s) => s.accessToken);
  const catalog = useServiceCatalog();
  const [rows, setRows] = useState<PlatformService[]>(FALLBACK);
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState<PlatformService | null>(null);
  const [secretKey, setSecretKey] = useState("");

  async function load() {
    if (!token) return;
    try {
      const res = await api<PlatformService[]>("/admin/services", { token });
      if (res.data?.length) setRows(res.data);
    } catch {
      // keep last
    }
  }

  useEffect(() => {
    void load();
  }, [token]);

  const enabledCount = useMemo(() => rows.filter((row) => row.isEnabled).length, [rows]);

  function askToggle(row: PlatformService) {
    setError("");
    setNote("");
    setSecretKey("");
    setPending(row);
  }

  async function confirmToggle(event: FormEvent) {
    event.preventDefault();
    if (!token || !pending) return;
    setBusy(pending.slug);
    setError("");
    try {
      const res = await api<PlatformService>(`/admin/services/${pending.slug}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ isEnabled: !pending.isEnabled, secretKey }),
      });
      if (res.data) {
        setRows((current) => current.map((row) => (row.slug === res.data!.slug ? res.data! : row)));
      }
      setNote(`${pending.name} is now ${pending.isEnabled ? "hidden from" : "visible on"} website, web app and mobile.`);
      setPending(null);
      setSecretKey("");
      await catalog.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not update service");
    } finally {
      setBusy("");
    }
  }

  return (
    <div>
      <AdminHeader
        title="Service management"
        action={
          <div className="flex items-center gap-1.5">
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">{enabledCount} live</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{rows.length - enabledCount} off</span>
          </div>
        }
      />
      {note ? <p className="mb-3 text-xs font-medium text-emerald-700">{note}</p> : null}

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {rows.map((row) => {
          const tone = BADGES[row.slug] ?? { box: "bg-slate-50", badge: "bg-slate-100 text-slate-700", ring: "ring-slate-200" };
          return (
            <article
              key={row.slug}
              className={`flex min-h-[8.5rem] flex-col justify-between rounded-xl p-3 shadow-sm ring-1 ${tone.box} ${tone.ring}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${tone.badge}`}>
                  <CategoryArt id={row.slug} size={28} className="h-7 w-7 object-contain" />
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    row.isEnabled ? "bg-emerald-600 text-white" : "bg-slate-800 text-white"
                  }`}
                >
                  {row.isEnabled ? "Live" : "Hidden"}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900">{row.name}</p>
              </div>
              <div className="inline-flex overflow-hidden rounded-lg bg-white ring-1 ring-slate-200">
                <button
                  type="button"
                  disabled={busy === row.slug || row.isEnabled}
                  onClick={() => askToggle(row)}
                  className={`flex-1 cursor-pointer px-3 py-1.5 text-xs font-semibold transition disabled:cursor-default ${
                    row.isEnabled ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
                  }`}
                >
                  Enable
                </button>
                <button
                  type="button"
                  disabled={busy === row.slug || !row.isEnabled}
                  onClick={() => askToggle(row)}
                  className={`flex-1 cursor-pointer px-3 py-1.5 text-xs font-semibold transition disabled:cursor-default ${
                    !row.isEnabled ? "bg-amber-500 text-white" : "text-slate-600 hover:bg-amber-50 hover:text-amber-800"
                  }`}
                >
                  Disable
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {pending ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <form onSubmit={confirmToggle} className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              {pending.isEnabled ? "Disable" : "Enable"} {pending.name}?
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {pending.isEnabled
                ? "Customers will no longer see this service on website, web app or mobile."
                : "This service will show again on website, web app and mobile."}{" "}
              Enter the secret key to confirm.
            </p>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Secret key
              <input
                type="password"
                required
                autoFocus
                value={secretKey}
                onChange={(event) => setSecretKey(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
            </label>
            {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setPending(null);
                  setError("");
                  setSecretKey("");
                }}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy === pending.slug}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
