export type CleaningItem = {
  name: string;
  selected: boolean;
  locked?: boolean;
  oneTime: boolean;
  oneTimeAmount: string;
  monthly: boolean;
  monthlyAmount: string;
};

export const DEFAULT_CLEANING_NAMES = ["House", "Bathroom", "Office"] as const;

export const WORK_CHARGES_NOTE = "Charges will be discussed and confirmed before starting the work.";

export function emptyCleaningItem(): CleaningItem {
  return {
    name: "",
    selected: true,
    locked: false,
    oneTime: false,
    oneTimeAmount: "",
    monthly: false,
    monthlyAmount: "",
  };
}

export function defaultCleaningItems(): CleaningItem[] {
  return DEFAULT_CLEANING_NAMES.map((name) => ({
    name,
    selected: false,
    locked: true,
    oneTime: false,
    oneTimeAmount: "",
    monthly: false,
    monthlyAmount: "",
  }));
}

export function selectedCleaningItems(items: CleaningItem[]) {
  return items.filter((item) => item.selected && item.name.trim());
}

export function cleaningItemLabel(item: CleaningItem) {
  const bits: string[] = [];
  if (item.oneTime && item.oneTimeAmount) bits.push(`One-Time ₹${item.oneTimeAmount} / Work`);
  if (item.monthly && item.monthlyAmount) bits.push(`Monthly ₹${item.monthlyAmount} / Month`);
  return bits.length ? `${item.name.trim()} (${bits.join(", ")})` : item.name.trim();
}

export function cleaningListingPrice(items: CleaningItem[]) {
  for (const item of selectedCleaningItems(items)) {
    if (item.oneTime && item.oneTimeAmount) return { price: item.oneTimeAmount, unit: "PER_WORK" as const };
    if (item.monthly && item.monthlyAmount) return { price: item.monthlyAmount, unit: "MONTHLY" as const };
  }
  return { price: "", unit: "PER_WORK" as const };
}
