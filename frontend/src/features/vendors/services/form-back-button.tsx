"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function FormBackButton({ fallback = "/vendors/services" }: { fallback?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label="Back"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
          return;
        }
        router.push(fallback);
      }}
      className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 md:inline-flex"
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
    </button>
  );
}
