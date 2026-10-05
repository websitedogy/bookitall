export const DEFAULT_LOCAL_SHOP_ITEMS = ["Groceries", "Vegetables"] as const;

export const LOCAL_SHOP_CATEGORIES = [
  "Kirana",
  "Vegetables & Fruits",
  "Meat & Fish",
  "Bakery",
  "Medical",
  "General store",
] as const;

export type LocalShopItemRow = {
  name: string;
  amount: string;
};

export function defaultLocalShopItems(): LocalShopItemRow[] {
  return DEFAULT_LOCAL_SHOP_ITEMS.map((name) => ({ name, amount: "" }));
}

export function emptyLocalShopItem(): LocalShopItemRow {
  return { name: "", amount: "" };
}

export function filledLocalShopItems(rows: LocalShopItemRow[]) {
  return rows.filter((row) => row.name.trim() && row.amount.trim());
}
