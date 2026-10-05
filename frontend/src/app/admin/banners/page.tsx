"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminCard, AdminHeader } from "@/features/admin/admin-shell";
import { useAdminAuth } from "@/features/auth/store";
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

export default function AdminBannersPage() {
  const token = useAdminAuth((s) => s.accessToken);
  const [rows, setRows] = useState<HeroBanner[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [href, setHref] = useState("/");
  const [file, setFile] = useState<File | null>(null);
  const [adding, setAdding] = useState(false);

  async function load() {
    if (!token) return;
    const res = await api<HeroBanner[]>("/admin/banners", { token });
    setRows(res.data ?? []);
  }

  useEffect(() => {
    if (!token) return;
    load().catch((err) => setError(err instanceof ApiError ? err.message : "Could not load hero images"));
  }, [token]);

  async function addBanner(event: FormEvent) {
    event.preventDefault();
    if (!token || !file) {
      setError("Choose an image");
      return;
    }
    setAdding(true);
    setError("");
    setNote("");
    try {
      const body = new FormData();
      body.set("title", title.trim());
      body.set("href", href.trim());
      body.set("photo", file);
      await api<HeroBanner>("/admin/banners", { method: "POST", token, body });
      setTitle("");
      setHref("/");
      setFile(null);
      setNote("Hero image added.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add hero image");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div>
      <AdminHeader title="Hero images" />
      <p className="mb-3 text-xs text-slate-500">These images show on the home page. Use the arrows on the site to move between them.</p>
      {note ? <p className="mb-3 text-xs font-medium text-emerald-700">{note}</p> : null}
      {error ? <p className="mb-3 text-xs font-medium text-red-600">{error}</p> : null}

      <div className="grid gap-3 lg:grid-cols-2">
        {rows.map((row, index) => (
          <BannerEditor
            key={`${row.id}-${row.updatedAt}`}
            row={row}
            token={token}
            canMoveUp={index > 0}
            canMoveDown={index < rows.length - 1}
            onChanged={async (message) => {
              setError("");
              setNote(message);
              await load();
            }}
            onError={(message) => {
              setNote("");
              setError(message);
            }}
          />
        ))}
      </div>

      <AdminCard className="mt-4">
        <h2 className="text-sm font-semibold text-slate-900">Add a hero image</h2>
        <form className="mt-3 grid gap-3 sm:grid-cols-2" onSubmit={addBanner}>
          <label className="block text-xs font-medium text-slate-600">
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              minLength={2}
              maxLength={80}
              placeholder="Weekend stays"
              className="mt-1 w-full rounded-lg border border-emerald-100 px-3 py-2 text-sm text-slate-900"
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Link
            <input
              value={href}
              onChange={(event) => setHref(event.target.value)}
              required
              placeholder="/hotels"
              className="mt-1 w-full rounded-lg border border-emerald-100 px-3 py-2 text-sm text-slate-900"
            />
          </label>
          <label className="block text-xs font-medium text-slate-600 sm:col-span-2">
            Image
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm text-slate-700"
            />
          </label>
          <div>
            <button
              type="submit"
              disabled={adding}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {adding ? "Adding…" : "Add hero image"}
            </button>
          </div>
        </form>
      </AdminCard>
    </div>
  );
}

function BannerEditor({
  row,
  token,
  canMoveUp,
  canMoveDown,
  onChanged,
  onError,
}: {
  row: HeroBanner;
  token: string | null;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onChanged: (message: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const [title, setTitle] = useState(row.title);
  const [href, setHref] = useState(row.href);
  const [enabled, setEnabled] = useState(row.isEnabled);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState("");

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!token) return;
    setBusy("save");
    try {
      const body = new FormData();
      body.set("title", title.trim());
      body.set("href", href.trim());
      body.set("isEnabled", enabled ? "true" : "false");
      if (file) body.set("photo", file);
      await api<HeroBanner>(`/admin/banners/${row.id}`, { method: "PATCH", token, body });
      await onChanged("Hero image saved.");
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Could not save hero image");
    } finally {
      setBusy("");
    }
  }

  async function move(direction: "up" | "down") {
    if (!token) return;
    setBusy(direction);
    try {
      await api(`/admin/banners/${row.id}/move`, {
        method: "POST",
        token,
        body: JSON.stringify({ direction }),
      });
      await onChanged("Order updated.");
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Could not reorder");
    } finally {
      setBusy("");
    }
  }

  async function remove() {
    if (!token) return;
    if (!window.confirm(`Remove “${row.title}” from the home page?`)) return;
    setBusy("delete");
    try {
      await api(`/admin/banners/${row.id}`, { method: "DELETE", token });
      await onChanged("Hero image removed.");
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "Could not remove hero image");
    } finally {
      setBusy("");
    }
  }

  return (
    <AdminCard>
      <form onSubmit={save} className="grid gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={row.image} alt="" className="h-36 w-full rounded-lg object-cover" />
        <label className="block text-xs font-medium text-slate-600">
          Title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            minLength={2}
            maxLength={80}
            className="mt-1 w-full rounded-lg border border-emerald-100 px-3 py-2 text-sm text-slate-900"
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Link
          <input
            value={href}
            onChange={(event) => setHref(event.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-emerald-100 px-3 py-2 text-sm text-slate-900"
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Replace image
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm text-slate-700"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
          Show on the home page
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={busy !== ""}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {busy === "save" ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            disabled={!canMoveUp || busy !== ""}
            onClick={() => void move("up")}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-emerald-100 disabled:opacity-40"
          >
            Move up
          </button>
          <button
            type="button"
            disabled={!canMoveDown || busy !== ""}
            onClick={() => void move("down")}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-emerald-100 disabled:opacity-40"
          >
            Move down
          </button>
          <button
            type="button"
            disabled={busy !== ""}
            onClick={() => void remove()}
            className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 ring-1 ring-red-100 disabled:opacity-40"
          >
            Remove
          </button>
        </div>
      </form>
    </AdminCard>
  );
}
