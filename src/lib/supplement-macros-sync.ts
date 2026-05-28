import type { Supplement } from "./types";
import {
  createFoodEntry,
  deleteFoodEntry,
  getFoodEntries,
  getSupplementIntakesForDate,
  getSupplements,
  updateFoodEntry,
} from "./db";
import {
  macroEntryId,
  SUPPLEMENT_MACRO_NOTE,
  getSupplementMacroConfig,
  supplementTracksMacros,
} from "./supplement-macros-config";

export async function syncSupplementMacroEntry(
  date: string,
  supplement: Supplement,
  quantity: number,
  taken: boolean
): Promise<void> {
  const config = getSupplementMacroConfig(supplement);
  if (!config) return;

  const entryId = macroEntryId(supplement.id, date);
  const qty = Math.max(1, quantity || 1);

  if (!taken) {
    await deleteFoodEntry(entryId);
    return;
  }

  const payload = {
    date,
    meal_type: config.mealType,
    name:
      config.allowsQuantity && qty > 1
        ? `${supplement.name} (${qty} scoops)`
        : supplement.name,
    calories: config.calories * qty,
    protein: config.protein * qty,
    fat: config.fat * qty,
    carbs: config.carbs * qty,
    notes: `${SUPPLEMENT_MACRO_NOTE}:${supplement.id}`,
  };

  const existing = (await getFoodEntries(date)).find((e) => e.id === entryId);
  if (existing) {
    await updateFoodEntry(entryId, payload);
  } else {
    try {
      await createFoodEntry({ id: entryId, ...payload });
    } catch {
      await updateFoodEntry(entryId, payload);
    }
  }
}

/** Ensure all checked supplements have matching food entries for macro totals */
export async function reconcileSupplementMacrosForDate(date: string): Promise<void> {
  const [intakes, supplements] = await Promise.all([
    getSupplementIntakesForDate(date),
    getSupplements(true),
  ]);

  const takenMap = new Map(
    intakes.filter((i) => i.taken).map((i) => [i.supplement_id, i.quantity ?? 1])
  );

  for (const supplement of supplements) {
    if (!supplementTracksMacros(supplement)) continue;
    const qty = takenMap.get(supplement.id);
    if (qty !== undefined) {
      await syncSupplementMacroEntry(date, supplement, qty, true);
    } else {
      await syncSupplementMacroEntry(date, supplement, 1, false);
    }
  }
}

export function splitMacroEntries(entries: Awaited<ReturnType<typeof getFoodEntries>>) {
  const fromSupplements = entries.filter((e) => e.notes?.startsWith(SUPPLEMENT_MACRO_NOTE));
  const fromMeals = entries.filter((e) => !e.notes?.startsWith(SUPPLEMENT_MACRO_NOTE));

  const sum = (list: typeof entries) =>
    list.reduce(
      (acc, e) => ({
        calories: acc.calories + e.calories,
        protein: acc.protein + e.protein,
        fat: acc.fat + e.fat,
        carbs: acc.carbs + e.carbs,
      }),
      { calories: 0, protein: 0, fat: 0, carbs: 0 }
    );

  return {
    fromMeals: sum(fromMeals),
    fromSupplements: sum(fromSupplements),
    fromMealsEntries: fromMeals,
    fromSupplementEntries: fromSupplements,
  };
}
