import type { MealType, Supplement } from "./types";

export const SUPPLEMENT_MACRO_NOTE = "__supplement_macro__";

export interface SupplementMacroConfig {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  allowsQuantity: boolean;
  mealType: MealType;
}

const QUEST_BAR: SupplementMacroConfig = {
  calories: 190,
  protein: 21,
  fat: 8,
  carbs: 4,
  allowsQuantity: false,
  mealType: "snack",
};

const WHEY_SCOOP: SupplementMacroConfig = {
  calories: 120,
  protein: 24,
  fat: 1,
  carbs: 3,
  allowsQuantity: true,
  mealType: "snack",
};

export function getSupplementMacroConfig(
  supplement: Supplement
): SupplementMacroConfig | null {
  if (supplement.tracks_macros) {
    return {
      calories: supplement.macro_calories ?? 0,
      protein: supplement.macro_protein ?? 0,
      fat: supplement.macro_fat ?? 0,
      carbs: supplement.macro_carbs ?? 0,
      allowsQuantity: !!supplement.allows_quantity,
      mealType: "snack",
    };
  }

  const name = supplement.name.toLowerCase();
  if (name.includes("quest")) return QUEST_BAR;
  if (name.includes("whey") || name.includes("gold standard")) return WHEY_SCOOP;
  return null;
}

export function supplementTracksMacros(supplement: Supplement): boolean {
  return getSupplementMacroConfig(supplement) !== null;
}

export function supplementAllowsQuantity(supplement: Supplement): boolean {
  const config = getSupplementMacroConfig(supplement);
  return config?.allowsQuantity ?? false;
}

export function macroEntryId(supplementId: string, date: string): string {
  return `macro-sup-${supplementId}-${date}`;
}

export function isSupplementMacroEntry(notes?: string): boolean {
  return !!notes?.startsWith(SUPPLEMENT_MACRO_NOTE);
}
