import {
  AirVent,
  Bath,
  BriefcaseBusiness,
  Building2,
  BusFront,
  CarFront,
  ChefHat,
  Hammer,
  Lightbulb,
  Map,
  Paintbrush,
  Refrigerator,
  Sparkles,
  SprayCan,
  Truck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/shared/lib/cn";

type CategoryIcon = {
  icon: LucideIcon;
  tone: string;
};

export const CATEGORY_ICONS: Record<string, CategoryIcon> = {
  hotels: { icon: Building2, tone: "bg-amber-50 text-amber-700" },
  tours: { icon: Map, tone: "bg-sky-50 text-sky-700" },
  cabs: { icon: CarFront, tone: "bg-orange-50 text-orange-700" },
  electrician: { icon: Lightbulb, tone: "bg-yellow-50 text-yellow-700" },
  plumber: { icon: Bath, tone: "bg-cyan-50 text-cyan-700" },
  ac: { icon: AirVent, tone: "bg-blue-50 text-blue-700" },
  cleaning: { icon: SprayCan, tone: "bg-teal-50 text-teal-700" },
  jobs: { icon: BriefcaseBusiness, tone: "bg-indigo-50 text-indigo-700" },
  beautician: { icon: Sparkles, tone: "bg-pink-50 text-pink-700" },
  painting: { icon: Paintbrush, tone: "bg-violet-50 text-violet-700" },
  carpenter: { icon: Hammer, tone: "bg-orange-50 text-orange-800" },
  appliance: { icon: Refrigerator, tone: "bg-slate-100 text-slate-700" },
  "public-transport": { icon: BusFront, tone: "bg-emerald-50 text-emerald-700" },
  "goods-transport": { icon: Truck, tone: "bg-blue-50 text-blue-700" },
  "packers-movers": { icon: Truck, tone: "bg-rose-50 text-rose-700" },
  "cloud-kitchen": { icon: ChefHat, tone: "bg-red-50 text-red-700" },
};

export function CategoryArt({
  id,
  size = 72,
  className = "",
  alt = "",
}: {
  id: string;
  size?: number;
  className?: string;
  priority?: boolean;
  alt?: string;
}) {
  const category = CATEGORY_ICONS[id] ?? { icon: Wrench, tone: "bg-slate-100 text-slate-700" };
  const Icon = category.icon;

  return (
    <span
      aria-label={alt || undefined}
      className={cn(
        "inline-flex items-center justify-center rounded-[18px] p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.45)] transition-transform duration-200 group-hover:scale-105",
        category.tone,
        className || "h-full w-full",
      )}
      style={className ? undefined : { width: size, height: size }}
    >
      <Icon aria-hidden={!alt} className="h-full w-full" size={size} strokeWidth={1.8} />
    </span>
  );
}
