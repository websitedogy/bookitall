import { cn } from "@/shared/lib/cn";
import type { GoodsTransportTypeId } from "./goods-transport-data";

function Tile({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 128 128" fill="none" className={cn("h-full w-full", className)} aria-hidden>
      {children}
    </svg>
  );
}

export function GoodsTransportIcon({ id, className = "" }: { id: GoodsTransportTypeId; className?: string }) {
  if (id === "tata-ace") {
    return (
      <Tile className={className}>
        <rect width="128" height="128" rx="28" fill="#FEF3C7" />
        <rect x="18" y="54" width="48" height="30" rx="6" fill="#D97706" />
        <path d="M66 60 H98 L108 84 H66 Z" fill="#F59E0B" />
        <rect x="74" y="66" width="16" height="10" rx="2" fill="#FEF3C7" />
        <circle cx="40" cy="92" r="9" fill="#1F2937" />
        <circle cx="90" cy="92" r="9" fill="#1F2937" />
      </Tile>
    );
  }
  if (id === "mini-lorry") {
    return (
      <Tile className={className}>
        <rect width="128" height="128" rx="28" fill="#FFEDD5" />
        <rect x="16" y="48" width="54" height="36" rx="6" fill="#C2410C" />
        <path d="M70 56 H100 L110 84 H70 Z" fill="#EA580C" />
        <rect x="80" y="64" width="14" height="10" rx="2" fill="#FFEDD5" />
        <circle cx="38" cy="94" r="9" fill="#1F2937" />
        <circle cx="92" cy="94" r="9" fill="#1F2937" />
      </Tile>
    );
  }
  if (id === "light-truck") {
    return (
      <Tile className={className}>
        <rect width="128" height="128" rx="28" fill="#DBEAFE" />
        <rect x="14" y="46" width="58" height="38" rx="6" fill="#1D4ED8" />
        <path d="M72 54 H102 L112 84 H72 Z" fill="#2563EB" />
        <rect x="82" y="62" width="14" height="12" rx="2" fill="#DBEAFE" />
        <circle cx="36" cy="94" r="9" fill="#0F172A" />
        <circle cx="94" cy="94" r="9" fill="#0F172A" />
      </Tile>
    );
  }
  if (id === "medium-truck") {
    return (
      <Tile className={className}>
        <rect width="128" height="128" rx="28" fill="#E0E7FF" />
        <rect x="12" y="42" width="64" height="42" rx="6" fill="#4338CA" />
        <path d="M76 52 H106 L114 84 H76 Z" fill="#4F46E5" />
        <rect x="84" y="60" width="14" height="12" rx="2" fill="#E0E7FF" />
        <circle cx="34" cy="96" r="9" fill="#1E1B4B" />
        <circle cx="96" cy="96" r="9" fill="#1E1B4B" />
      </Tile>
    );
  }
  if (id === "heavy-truck") {
    return (
      <Tile className={className}>
        <rect width="128" height="128" rx="28" fill="#DCFCE7" />
        <rect x="10" y="38" width="68" height="46" rx="6" fill="#15803D" />
        <path d="M78 50 H108 L116 84 H78 Z" fill="#16A34A" />
        <rect x="86" y="58" width="14" height="12" rx="2" fill="#DCFCE7" />
        <circle cx="32" cy="96" r="9" fill="#14532D" />
        <circle cx="70" cy="96" r="8" fill="#14532D" />
        <circle cx="98" cy="96" r="9" fill="#14532D" />
      </Tile>
    );
  }
  return (
    <Tile className={className}>
      <rect width="128" height="128" rx="28" fill="#F1F5F9" />
      <rect x="28" y="40" width="72" height="48" rx="10" fill="#64748B" />
      <rect x="40" y="52" width="48" height="8" rx="2" fill="#E2E8F0" />
      <rect x="40" y="66" width="28" height="8" rx="2" fill="#CBD5E1" />
      <circle cx="48" cy="96" r="8" fill="#0F172A" />
      <circle cx="84" cy="96" r="8" fill="#0F172A" />
    </Tile>
  );
}
