export function formatNumber(n: number, decimals = 0): string {
  return n.toFixed(decimals);
}

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function pct(current: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(100, Math.round((current / goal) * 100));
}

export function mealLabel(meal: string): string {
  return meal.charAt(0).toUpperCase() + meal.slice(1);
}

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export const PHOTO_CATEGORIES = ["meal", "body", "progress"] as const;

export const MACRO_COLORS = {
  calories: "#f97316",
  protein: "#3b82f6",
  fat: "#eab308",
  carbs: "#22c55e",
} as const;
