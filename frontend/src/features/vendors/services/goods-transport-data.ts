export const GOODS_TRANSPORT_TYPES = [
  { id: "tata-ace", name: "Tata Ace", permit: false },
  { id: "mini-lorry", name: "Mini Lorry", permit: false },
  { id: "light-truck", name: "Light Truck", permit: true },
  { id: "medium-truck", name: "Medium Truck", permit: true },
  { id: "heavy-truck", name: "Heavy Truck", permit: true },
  { id: "other", name: "Other", permit: true },
] as const;

export type GoodsTransportTypeId = (typeof GOODS_TRANSPORT_TYPES)[number]["id"];

export function goodsTransportTypeById(id: string | undefined | null) {
  if (!id) return null;
  const normalized = id.trim().toLowerCase();
  return (
    GOODS_TRANSPORT_TYPES.find(
      (item) => item.id === normalized || item.name.toLowerCase() === normalized || item.name.toLowerCase().replace(/\s+/g, "-") === normalized,
    ) ?? null
  );
}

export function goodsTransportTypeHref(base: string, typeId: string) {
  const url = new URL(base, "https://bookitall.local");
  url.searchParams.set("type", typeId);
  return `${url.pathname}?${url.searchParams.toString()}`;
}

export function goodsNeedsPermit(typeId: string, storedName?: string) {
  const match = goodsTransportTypeById(typeId) || goodsTransportTypeById(storedName);
  return match?.permit ?? true;
}

export function matchesGoodsType(stored: string | undefined, wantedId: string) {
  const wanted = wantedId.trim().toLowerCase();
  const value = (stored || "").trim().toLowerCase();
  if (!wanted) return true;
  if (wanted === "other") {
    return !GOODS_TRANSPORT_TYPES.some((item) => item.id !== "other" && (value === item.name.toLowerCase() || value === item.id));
  }
  const type = goodsTransportTypeById(wanted);
  return value === wanted || value === type?.name.toLowerCase() || value.replace(/\s+/g, "-") === wanted;
}

const currentYear = new Date().getFullYear();
export const GOODS_YEARS = Array.from({ length: currentYear - 1994 }, (_, index) => String(currentYear - index));
