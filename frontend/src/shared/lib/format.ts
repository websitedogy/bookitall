export function priceUnitWord(unit?: string | null) {
  const raw = String(unit ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^\/\s*/, "")
    .replace(/^per\s+/, "");
  if (!raw) return "";
  if (raw === "hour" || raw === "hourly") return "hourly";
  if (raw === "day" || raw === "daily") return "daily";
  if (raw === "night") return "night";
  if (raw === "km") return "km";
  if (raw === "person") return "person";
  if (raw === "room") return "room";
  if (raw === "visit") return "visit";
  if (raw === "service") return "service";
  return raw;
}

export function inr(value: string | number) {
  const amount = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function stars(value: string | number) {
  return Number(value).toFixed(1);
}
