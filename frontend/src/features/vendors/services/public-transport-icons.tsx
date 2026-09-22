import { cn } from "@/shared/lib/cn";
import type { PublicTransportTypeId } from "./public-transport-data";

function Tile({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <svg viewBox="0 0 128 128" fill="none" className={cn("h-full w-full", className)} aria-hidden>
      {children}
    </svg>
  );
}

export function PublicTransportIcon({ id, className = "" }: { id: PublicTransportTypeId; className?: string }) {
  if (id === "auto") {
    return (
      <Tile className={className}>
        <rect width="128" height="128" rx="28" fill="#FEF3C7" />
        <rect x="26" y="54" width="52" height="30" rx="8" fill="#D97706" />
        <path d="M78 60 H102 L110 84 H78 Z" fill="#F59E0B" />
        <rect x="34" y="60" width="14" height="10" rx="2" fill="#FEF3C7" />
        <rect x="52" y="60" width="14" height="10" rx="2" fill="#FEF3C7" />
        <circle cx="44" cy="92" r="9" fill="#1F2937" />
        <circle cx="44" cy="92" r="3.5" fill="#FDE68A" />
        <circle cx="94" cy="92" r="9" fill="#1F2937" />
        <circle cx="94" cy="92" r="3.5" fill="#FDE68A" />
        <rect x="44" y="42" width="22" height="12" rx="4" fill="#FBBF24" />
      </Tile>
    );
  }
  if (id === "car") {
    return (
      <Tile className={className}>
        <rect width="128" height="128" rx="28" fill="#DBEAFE" />
        <path d="M28 74 L40 52 H88 L100 74 Z" fill="#0EA5E9" />
        <rect x="22" y="72" width="84" height="20" rx="8" fill="#0369A1" />
        <rect x="44" y="54" width="16" height="12" rx="2" fill="#E0F2FE" />
        <rect x="68" y="54" width="16" height="12" rx="2" fill="#E0F2FE" />
        <circle cx="42" cy="94" r="9" fill="#0F172A" />
        <circle cx="42" cy="94" r="3.5" fill="#94A3B8" />
        <circle cx="88" cy="94" r="9" fill="#0F172A" />
        <circle cx="88" cy="94" r="3.5" fill="#94A3B8" />
      </Tile>
    );
  }
  if (id === "mini-bus") {
    return (
      <Tile className={className}>
        <rect width="128" height="128" rx="28" fill="#E0E7FF" />
        <rect x="24" y="42" width="80" height="48" rx="10" fill="#4F46E5" />
        <rect x="32" y="50" width="14" height="12" rx="2" fill="#C7D2FE" />
        <rect x="50" y="50" width="14" height="12" rx="2" fill="#C7D2FE" />
        <rect x="68" y="50" width="14" height="12" rx="2" fill="#C7D2FE" />
        <rect x="86" y="50" width="10" height="12" rx="2" fill="#A5B4FC" />
        <circle cx="44" cy="96" r="9" fill="#1E1B4B" />
        <circle cx="44" cy="96" r="3.5" fill="#C7D2FE" />
        <circle cx="88" cy="96" r="9" fill="#1E1B4B" />
        <circle cx="88" cy="96" r="3.5" fill="#C7D2FE" />
      </Tile>
    );
  }
  if (id === "bus") {
    return (
      <Tile className={className}>
        <rect width="128" height="128" rx="28" fill="#DCFCE7" />
        <rect x="18" y="36" width="92" height="56" rx="12" fill="#15803D" />
        <rect x="26" y="46" width="14" height="12" rx="2" fill="#BBF7D0" />
        <rect x="44" y="46" width="14" height="12" rx="2" fill="#BBF7D0" />
        <rect x="62" y="46" width="14" height="12" rx="2" fill="#BBF7D0" />
        <rect x="80" y="46" width="14" height="12" rx="2" fill="#BBF7D0" />
        <rect x="26" y="64" width="70" height="6" rx="2" fill="#86EFAC" />
        <circle cx="40" cy="100" r="9" fill="#14532D" />
        <circle cx="40" cy="100" r="3.5" fill="#BBF7D0" />
        <circle cx="90" cy="100" r="9" fill="#14532D" />
        <circle cx="90" cy="100" r="3.5" fill="#BBF7D0" />
      </Tile>
    );
  }
  return (
    <Tile className={className}>
      <rect width="128" height="128" rx="28" fill="#F3E8FF" />
      <rect x="22" y="50" width="58" height="36" rx="8" fill="#7C3AED" />
      <path d="M80 58 H104 L112 86 H80 Z" fill="#8B5CF6" />
      <rect x="30" y="58" width="16" height="12" rx="2" fill="#EDE9FE" />
      <rect x="50" y="58" width="16" height="12" rx="2" fill="#EDE9FE" />
      <rect x="88" y="64" width="12" height="10" rx="2" fill="#EDE9FE" />
      <circle cx="42" cy="94" r="9" fill="#3B0764" />
      <circle cx="42" cy="94" r="3.5" fill="#DDD6FE" />
      <circle cx="94" cy="94" r="9" fill="#3B0764" />
      <circle cx="94" cy="94" r="3.5" fill="#DDD6FE" />
    </Tile>
  );
}
