"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

type DeferredPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    __biaDeferredPrompt?: DeferredPrompt | null;
  }
}

const INSTALLED_KEY = "bookitall-pwa-installed";
const DISMISS_KEY = "bookitall-pwa-dismissed";

function alreadyInstalled() {
  if (typeof window === "undefined") return true;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  if ((navigator as Navigator & { standalone?: boolean }).standalone) return true;
  try {
    return localStorage.getItem(INSTALLED_KEY) === "1";
  } catch {
    return false;
  }
}

function isIosSafari() {
  const ua = navigator.userAgent;
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return ios && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

export function InstallAppPrompt() {
  const pathname = usePathname();
  const [promptEvent, setPromptEvent] = useState<DeferredPrompt | null>(null);
  const [open, setOpen] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (alreadyInstalled()) return;
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      // still show
    }

    const show = (event?: DeferredPrompt | null) => {
      if (alreadyInstalled()) return;
      if (event) setPromptEvent(event);
      setOpen(true);
    };

    if (window.__biaDeferredPrompt) show(window.__biaDeferredPrompt);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      const next = event as DeferredPrompt;
      window.__biaDeferredPrompt = next;
      show(next);
    };
    const onInstalled = () => {
      try {
        localStorage.setItem(INSTALLED_KEY, "1");
      } catch {
        // ignore
      }
      window.__biaDeferredPrompt = null;
      setPromptEvent(null);
      setOpen(false);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    if (!window.__biaDeferredPrompt && isIosSafari()) show(null);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (
    !open ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/admin")
  ) {
    return null;
  }

  function dismiss() {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    setOpen(false);
    setIosHint(false);
  }

  async function install() {
    if (promptEvent) {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      window.__biaDeferredPrompt = null;
      setPromptEvent(null);
      if (choice.outcome === "accepted") {
        try {
          localStorage.setItem(INSTALLED_KEY, "1");
        } catch {
          // ignore
        }
        setOpen(false);
      }
      return;
    }
    setIosHint(true);
  }

  return (
    <div className="sticky top-0 z-50 border-b border-[var(--primary)]/20 bg-[#0f4f4a] text-white">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-2 md:gap-4 md:px-8 md:py-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon.svg" alt="" className="h-10 w-10 shrink-0 rounded-lg md:h-11 md:w-11" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-tight md:text-sm">Install Book It All</p>
          <p className="mt-0.5 truncate text-[11px] leading-tight text-white/70 md:text-xs">
            {iosHint ? "Tap Share, then Add to Home Screen" : "Book hotels, tours, cabs and home services"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 md:gap-3">
          <button
            type="button"
            onClick={() => void install()}
            className="inline-flex h-8 items-center justify-center rounded-md bg-[var(--primary)] px-3 text-[12px] font-semibold text-white md:h-9 md:rounded-lg md:px-4 md:text-[13px]"
          >
            Install App
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white/70 hover:bg-white/10 hover:text-white md:h-9 md:w-auto md:px-2"
            aria-label="Not now"
          >
            <span className="hidden text-[13px] font-medium md:inline">Not now</span>
            <X className="h-4 w-4 md:hidden" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
