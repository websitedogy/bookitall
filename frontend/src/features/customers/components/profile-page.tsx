"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Camera, LocateFixed, MapPin } from "lucide-react";
import { useAuth, useAuthHydrated, type AuthUser, type ProfileGender } from "@/features/auth/store";
import { api, ApiError } from "@/shared/lib/api";
import { publicEmail } from "@/shared/lib/email";
import { getExactPosition, getQuickPosition, locateExactPlace } from "@/shared/lib/geo";
import { mediaUrl } from "@/shared/lib/stable-image";
import { cn } from "@/shared/lib/cn";
import { missingProfileFields } from "../lib/profile-completeness";
import { ProfileStatusBadge } from "./profile-status-badge";

type FormState = {
  nickname: string;
  email: string;
  dateOfBirth: string;
  gender: ProfileGender | "";
  personalAddress: string;
  pincode: string;
  addressLatitude: number | null;
  addressLongitude: number | null;
};

const GENDERS: { value: ProfileGender; label: string }[] = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

function fromUser(user: AuthUser): FormState {
  return {
    nickname: user.nickname ?? "",
    email: publicEmail(user.email),
    dateOfBirth: user.dateOfBirth?.slice(0, 10) ?? "",
    gender: user.gender ?? "",
    personalAddress: user.personalAddress ?? "",
    pincode: user.pincode ?? "",
    addressLatitude: user.addressLatitude ?? null,
    addressLongitude: user.addressLongitude ?? null,
  };
}

function pinFromText(value: string) {
  return value.match(/\b(\d{6})\b/)?.[1] ?? "";
}

export function ProfilePage() {
  const router = useRouter();
  const ready = useAuthHydrated();
  const user = useAuth((s) => s.user);
  const token = useAuth((s) => s.accessToken);
  const updateUser = useAuth((s) => s.updateUser);
  const photoRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [locateBusy, setLocateBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [addressMode, setAddressMode] = useState<"pick" | "manual">("pick");

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/login?next=/account");
  }, [ready, user, router]);

  useEffect(() => {
    if (!user) return;
    setForm((current) => current ?? fromUser(user));
    if (user.personalAddress && !user.addressLatitude) setAddressMode("manual");
  }, [user]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api<AuthUser>("/auth/me", { token })
      .then((res) => {
        if (cancelled || !res.data) return;
        updateUser(res.data);
        setForm(fromUser(res.data));
        if (res.data.personalAddress && !res.data.addressLatitude) setAddressMode("manual");
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [token, updateUser]);

  const draft = useMemo(() => {
    if (!user || !form) return user;
    return {
      ...user,
      nickname: form.nickname,
      email: form.email,
      dateOfBirth: form.dateOfBirth,
      gender: form.gender || null,
      personalAddress: form.personalAddress,
      pincode: form.pincode,
    };
  }, [user, form]);

  const missing = missingProfileFields(draft);
  const status = missing.length ? "PENDING" : "COMPLETE";

  if (!ready || !user || !form) {
    return <p className="px-1 py-10 text-sm text-[var(--text-muted)]">Loading profile…</p>;
  }

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
    setSaved(false);
    setError("");
  }

  async function onPhoto(file?: File | null) {
    if (!file) return;
    setPhotoBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("photo", file);
      const res = await api<AuthUser>("/auth/me/avatar", { method: "POST", body });
      if (res.data) updateUser(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not upload photo");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function pickCurrentLocation() {
    setLocateBusy(true);
    setError("");
    try {
      const position = await getExactPosition(12000).catch(() => getQuickPosition(8000));
      const place = await locateExactPlace(position.coords.latitude, position.coords.longitude);
      const address = place.full || [place.line1, place.line2].filter(Boolean).join(", ");
      setForm((current) =>
        current
          ? {
              ...current,
              personalAddress: address,
              pincode: current.pincode || pinFromText(address),
              addressLatitude: position.coords.latitude,
              addressLongitude: position.coords.longitude,
            }
          : current,
      );
      setAddressMode("pick");
      setSaved(false);
    } catch {
      setError("Allow location access, or enter your address.");
      setAddressMode("manual");
    } finally {
      setLocateBusy(false);
    }
  }

  async function save() {
    if (!form) return;
    const next = form;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await api<AuthUser>("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          nickname: next.nickname.trim(),
          email: next.email.trim(),
          dateOfBirth: next.dateOfBirth || null,
          gender: next.gender || null,
          personalAddress: next.personalAddress.trim(),
          pincode: next.pincode.replace(/\D/g, ""),
          addressLatitude: next.addressLatitude,
          addressLongitude: next.addressLongitude,
        }),
      });
      if (res.data) {
        updateUser(res.data);
        setForm(fromUser(res.data));
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-1 pb-8 md:max-w-xl">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">My Profile</h1>
        <ProfileStatusBadge status={status} />
      </div>

      <section className="mt-5 flex items-center gap-4 rounded-3xl bg-white p-5 ring-1 ring-[var(--border)]">
        <button
          type="button"
          onClick={() => photoRef.current?.click()}
          className={cn(
            "relative inline-flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--primary)] text-xl font-semibold text-white",
            missing.includes("avatarUrl") && "ring-2 ring-amber-400 ring-offset-2",
          )}
          aria-label="Profile photo"
        >
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl(user.avatarUrl)} alt="" className="h-full w-full object-cover" />
          ) : (
            user.fullName.charAt(0)
          )}
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-black/45 py-1">
            <Camera className="h-3 w-3" aria-hidden />
          </span>
        </button>
        <input
          ref={photoRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            void onPhoto(file);
          }}
        />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{user.fullName}</p>
          <p className="truncate text-sm text-[var(--text-muted)]">{user.phone}</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {photoBusy ? "Uploading…" : missing.includes("avatarUrl") ? "Photo required" : ""}
          </p>
        </div>
      </section>

      <form
        className="mt-4 space-y-4 rounded-3xl bg-white p-5 ring-1 ring-[var(--border)]"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <Field label="Nick name" missing={missing.includes("nickname")}>
          <input
            value={form.nickname}
            onChange={(event) => patch("nickname", event.target.value)}
            className={inputClass(missing.includes("nickname"))}
          />
        </Field>
        <Field label="Email" missing={missing.includes("email")}>
          <input
            type="email"
            value={form.email}
            onChange={(event) => patch("email", event.target.value)}
            className={inputClass(missing.includes("email"))}
          />
        </Field>
        <Field label="Date of Birth" missing={missing.includes("dateOfBirth")}>
          <input
            type="date"
            value={form.dateOfBirth}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(event) => patch("dateOfBirth", event.target.value)}
            className={inputClass(missing.includes("dateOfBirth"))}
          />
        </Field>
        <Field label="Gender" missing={missing.includes("gender")}>
          <div className="grid grid-cols-3 gap-2">
            {GENDERS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => patch("gender", option.value)}
                className={cn(
                  "h-11 rounded-2xl text-sm font-semibold ring-1",
                  form.gender === option.value
                    ? "bg-[var(--primary)] text-white ring-[var(--primary)]"
                    : missing.includes("gender")
                      ? "bg-amber-50 text-[var(--text)] ring-amber-300"
                      : "bg-white text-[var(--text)] ring-[var(--border)]",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Address" missing={missing.includes("personalAddress")}>
          <div className="mb-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setAddressMode("pick");
                void pickCurrentLocation();
              }}
              className={cn(
                "inline-flex h-10 items-center justify-center gap-1.5 rounded-2xl text-xs font-semibold ring-1",
                addressMode === "pick"
                  ? "bg-[var(--primary-soft)] text-[var(--primary)] ring-[var(--primary)]/20"
                  : "bg-white text-[var(--text)] ring-[var(--border)]",
              )}
            >
              <LocateFixed className="h-3.5 w-3.5" aria-hidden />
              {locateBusy ? "Detecting…" : "Current location"}
            </button>
            <button
              type="button"
              onClick={() => setAddressMode("manual")}
              className={cn(
                "inline-flex h-10 items-center justify-center gap-1.5 rounded-2xl text-xs font-semibold ring-1",
                addressMode === "manual"
                  ? "bg-[var(--primary-soft)] text-[var(--primary)] ring-[var(--primary)]/20"
                  : "bg-white text-[var(--text)] ring-[var(--border)]",
              )}
            >
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              Enter manually
            </button>
          </div>
          <textarea
            value={form.personalAddress}
            onChange={(event) => {
              const next = event.target.value;
              patch("personalAddress", next);
              if (!form.pincode) {
                const pin = pinFromText(next);
                if (pin) patch("pincode", pin);
              }
            }}
            rows={3}
            className={cn(inputClass(missing.includes("personalAddress")), "min-h-[88px] resize-none py-3")}
          />
        </Field>
        <Field label="Pincode" missing={missing.includes("pincode")}>
          <input
            inputMode="numeric"
            maxLength={6}
            value={form.pincode}
            onChange={(event) => patch("pincode", event.target.value.replace(/\D/g, "").slice(0, 6))}
            className={inputClass(missing.includes("pincode"))}
          />
        </Field>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {saved ? <p className="text-sm text-emerald-700">Saved.</p> : null}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-12 w-full items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  missing,
  children,
}: {
  label: string;
  missing?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">{label}</span>
        {missing ? <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700">Required</span> : null}
      </span>
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}

function inputClass(missing: boolean) {
  return cn(
    "h-11 w-full rounded-2xl bg-white px-3 text-sm text-[var(--text)] outline-none ring-1",
    missing ? "bg-amber-50 ring-amber-300 focus:ring-amber-500" : "ring-[var(--border)] focus:ring-[var(--primary)]",
  );
}
