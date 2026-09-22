"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { useAuth, isPanelRole } from "@/features/auth/store";
import { api } from "@/shared/lib/api";
import { enableVendorPush, isStandaloneApp, pushSupported, subscribeVendorPush } from "@/shared/lib/vendor-push";

function isVendor(role?: string) {
  return role === "PARTNER" || role === "DRIVER" || role === "TECHNICIAN";
}

function isIos() {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function VendorOrderPush() {
  const pathname = usePathname();
  const token = useAuth((s) => s.accessToken);
  const user = useAuth((s) => s.user);
  const vendor = isVendor(user?.role);
  const registering =
    pathname.startsWith("/vendors/services") || pathname.startsWith("/add-service");
  const [listed, setListed] = useState(false);
  const [mode, setMode] = useState<"off" | "need" | "denied" | "install">("off");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token || !vendor) {
      setListed(false);
      return;
    }
    let cancelled = false;
    void api<{ id: string }[]>("/vendor-listings/mine", { token })
      .then((res) => {
        if (!cancelled) setListed((res.data ?? []).length > 0);
      })
      .catch(() => {
        if (!cancelled) setListed(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, vendor, pathname]);

  useEffect(() => {
    if (!token || !vendor || !listed || isPanelRole(user?.role)) {
      setMode("off");
      return;
    }
    if (!pushSupported()) {
      setMode(isIos() && !isStandaloneApp() ? "install" : "off");
      return;
    }
    if (Notification.permission === "granted") {
      void subscribeVendorPush(token)
        .then((ok) => setMode(ok ? "off" : "need"))
        .catch(() => setMode("need"));
      return;
    }
    if (Notification.permission === "denied") {
      setMode("denied");
      return;
    }
    setMode(isIos() && !isStandaloneApp() ? "install" : "need");
  }, [token, user, vendor, listed]);

  if (
    mode === "off" ||
    !vendor ||
    !listed ||
    registering ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/admin")
  ) {
    return null;
  }

  async function turnOn() {
    if (!token) return;
    setBusy(true);
    try {
      const ok = await enableVendorPush(token);
      setMode(ok ? "off" : Notification.permission === "denied" ? "denied" : "need");
    } catch {
      setMode("need");
    } finally {
      setBusy(false);
    }
  }

  const copy =
    mode === "install"
      ? "Install Book It All on the Home Screen, then tap Turn on so new orders ring even if the phone is aside."
      : mode === "denied"
        ? "Alerts are blocked. Allow notifications for Book It All in browser or phone settings."
        : "Tap Turn on so new jobs ring this phone even when the app is closed.";

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-3 py-2.5 text-amber-950 md:px-8">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <Bell className="h-4 w-4 shrink-0 text-amber-700" aria-hidden />
        <p className="min-w-0 flex-1 text-[12px] leading-snug md:text-[13px]">{copy}</p>
        {mode === "need" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void turnOn()}
            className="shrink-0 rounded-full bg-[var(--primary)] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Turning on…" : "Turn on"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
