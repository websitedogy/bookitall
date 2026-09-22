export const DEFAULT_CLOUD_KITCHEN_FOODS = ["Meals", "Fast Food"] as const;

export type CloudKitchenFoodRow = {
  name: string;
  amount: string;
};

export function defaultCloudKitchenFoods(): CloudKitchenFoodRow[] {
  return DEFAULT_CLOUD_KITCHEN_FOODS.map((name) => ({ name, amount: "" }));
}

export function emptyCloudKitchenFood(): CloudKitchenFoodRow {
  return { name: "", amount: "" };
}

export function filledCloudKitchenFoods(rows: CloudKitchenFoodRow[]) {
  return rows.filter((row) => row.name.trim() && row.amount.trim());
}
