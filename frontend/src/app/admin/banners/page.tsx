"use client";

import { FormEvent, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, X } from "lucide-react";
import { AdminCard, AdminHeader } from "@/features/admin/admin-shell";
import { useAdminAuth } from "@/features/auth/store";
import { SERVICE_NAV } from "@/features/home/service-nav";
import { ApiError, api } from "@/shared/lib/api";

type HeroBanner = {
  id: string;
  slug: string;
  title: string;
  href: string;
  image: string;
  sortOrder: number;
  isEnabled: boolean;
  updatedAt: string;
};

const DESTINATIONS = [
  { name: "Hotels", href: "/hotels" },
  { name: "Tours", href: "/tours" },
  { name: "Cabs", href: "/cabs" },
  { name: "Home services", href: "/home-services" },
  ...SERVICE_NAV.filter((item) => !["hotels", "tours", "cabs"].includes(item.id)).map((item) => ({
    name: item.name,
    href: item.href,
  })),
];

function destinationName(href: string) {
  return DESTINATIONS.find((item) => item.href === href)?.name ?? "Home";
}

export default function AdminBannersPage() {
  const token = useAdminAuth((s) => s.accessToken);
  const [rows, setRows] = useState<HeroBanner[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [editor, setEditor] = useState<HeroBanner | "new" | null>(null);

  async function load() {
    if (!token) return;
    const res = await api<HeroBanner[]>("/admin/banners", { token });
    setRows(res.data ?? []);
  }

  useEffect(() => {
    if (!token) return;
    load().catch((err) => setError(err instanceof ApiError ? err.message : "Could not load hero images"));
  }, [token]);

  async function move(row: HeroBanner, direction: "up" | "down") {
    if (!token) return;
    setBusyId(row.id);
    setError("");
    try {
      await api(`/admin/banners/${row.id}/move`, {
        method: "POST",
        token,
        body: JSON.stringify({ direction }),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reorder");
    } finally {
      setBusyId("");
    }
  }

  async function toggle(row: HeroBanner) {
    if (!token) return;
    setBusyId(row.id);
    setError("");
    try {
      const body = new FormData();
      body.set("isEnabled", row.isEnabled ? "false" : "true");
      await api(`/admin/banners/${row.id}`, { method: "PATCH", token, body });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update");
    } finally {
      setBusyId("");
    }
  }

  async function remove(row: HeroBanner) {
    if (!token) return;
    if (!window.confirm("Remove this photo from the home page?")) return;
    setBusyId(row.id);
    setError("");
    try {
      await api(`/admin/banners/${row.id}`, { method: "DELETE", token });
      setNote("Photo removed.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not remove");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div>
      <AdminHeader
        title="Hero images"
        action={
          <button
            type="button"
            aria-label="Add hero image"
            onClick={() => setEditor("new")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" strokeWidth={2.4} />
          </button>
        }
      />
      {note ? <p className="mb-2 text-xs font-medium text-emerald-700">{note}</p> : null}
      {error ? <p className="mb-2 text-xs font-medium text-red-600">{error}</p> : null}

      <AdminCard className="overflow-hidden p-0">
        {rows.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">No photos yet. Tap + to add one.</p>
        ) : (
          <table className="admin-table w-full text-left text-sm">
            <thead className="bg-emerald-50/70 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
              <tr>
                <th className="w-16 px-3 py-2">Photo</th>
                <th className="px-3 py-2">Opens</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {rows.map((row, index) => {
                const locked = busyId === row.id;
                return (
                  <tr key={row.id}>
                    <td className="px-3 py-2" data-label="Photo">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={row.image} alt="" className="h-12 w-20 rounded-md object-cover" />
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-800" data-label="Opens">
                      {destinationName(row.href)}
                    </td>
                    <td className="px-3 py-2" data-label="Status">
                      <button
                        type="button"
                        disabled={locked}
                        onClick={() => void toggle(row)}
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          row.isEnabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {row.isEnabled ? "Live" : "Hidden"}
                      </button>
                    </td>
                    <td className="px-3 py-2" data-label="">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          aria-label="Move up"
                          disabled={locked || index === 0}
                          onClick={() => void move(row, "up")}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-emerald-50 disabled:opacity-30"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Move down"
                          disabled={locked || index === rows.length - 1}
                          onClick={() => void move(row, "down")}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-emerald-50 disabled:opacity-30"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Change photo"
                          disabled={locked}
                          onClick={() => setEditor(row)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-emerald-50 disabled:opacity-30"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label="Remove photo"
                          disabled={locked}
                          onClick={() => void remove(row)}
                          className="rounded-md p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </AdminCard>

      {editor ? (
        <BannerModal
          token={token}
          row={editor === "new" ? null : editor}
          onClose={() => setEditor(null)}
          onSaved={async (message) => {
            setEditor(null);
            setError("");
            setNote(message);
            await load();
          }}
        />
      ) : null}
    </div>
  );
}

function BannerModal({
  token,
  row,
  onClose,
  onSaved,
}: {
  token: string | null;
  row: HeroBanner | null;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [href, setHref] = useState(row?.href && DESTINATIONS.some((item) => item.href === row.href) ? row.href : DESTINATIONS[0].href);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(row?.image ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!file) {
      setPreview(row?.image ?? "");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file, row?.image]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    if (!row && !file) {
      setError("Choose a photo");
      return;
    }
    const destination = DESTINATIONS.find((item) => item.href === href) ?? DESTINATIONS[0];
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.set("title", destination.name);
      body.set("href", destination.href);
      body.set("isEnabled", "true");
      if (file) body.set("photo", file);
      if (row) {
        body.set("isEnabled", row.isEnabled ? "true" : "false");
        await api(`/admin/banners/${row.id}`, { method: "PATCH", token, body });
        await onSaved("Photo updated.");
      } else {
        await api("/admin/banners", { method: "POST", token, body });
        await onSaved("Photo added.");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <form
        onClick={(event) => event.stopPropagation()}
        onSubmit={save}
        className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">{row ? "Change photo" : "Add photo"}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="block text-xs font-medium text-slate-600">
          Opens
          <select
            value={href}
            onChange={(event) => setHref(event.target.value)}
            className="mt-1 w-full rounded-lg border border-emerald-100 bg-white px-3 py-2 text-sm text-slate-900"
          >
            {DESTINATIONS.map((item) => (
              <option key={item.href} value={item.href}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-3 block cursor-pointer rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 px-3 py-4 text-center">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="mx-auto mb-2 h-28 w-full rounded-lg object-cover" />
          ) : null}
          <span className="text-sm font-medium text-emerald-800">{file ? file.name : "Choose image"}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>

        {error ? <p className="mt-2 text-xs font-medium text-red-600">{error}</p> : null}

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
