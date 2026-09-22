"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Headphones } from "lucide-react";
import { useAuth } from "@/features/auth/store";
import { api } from "@/shared/lib/api";
import { cn } from "@/shared/lib/cn";
import { SUPPORT_UNREAD_EVENT } from "@/features/support/unread";

export function HeaderSupport({ compact = false }: { compact?: boolean }) {
  const token = useAuth((s) => s.accessToken);
  const user = useAuth((s) => s.user);
  const [unread, setUnread] = useState(0);

  const loadCount = useCallback(async () => {
    if (!token || !user) {
      setUnread(0);
      return;
    }
    try {
      const res = await api<number>("/notifications/unread-count?kind=support", { token });
      setUnread(typeof res.data === "number" ? res.data : 0);
    } catch {
      // Keep last count.
    }
  }, [token, user]);

  useEffect(() => {
    void loadCount();
    if (!token) return;
    const timer = window.setInterval(() => void loadCount(), 8_000);
    const onRefresh = () => void loadCount();
    window.addEventListener(SUPPORT_UNREAD_EVENT, onRefresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener(SUPPORT_UNREAD_EVENT, onRefresh);
    };
  }, [loadCount, token]);

  return (
    <Link
      href={user ? "/support/chat" : "/login?next=/support/chat"}
      aria-label={unread > 0 ? `Support, ${unread} new` : "Support"}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full text-[var(--primary)] hover:bg-[var(--primary-soft)]",
        compact ? "h-10 w-10" : "h-10 w-10",
      )}
    >
      <Headphones className={compact ? "h-5 w-5" : "h-[1.15rem] w-[1.15rem]"} strokeWidth={2} aria-hidden />
      {unread > 0 ? (
        <span className="absolute right-1 top-1 inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-rose-500 px-0.5 text-[8px] font-bold leading-none text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
