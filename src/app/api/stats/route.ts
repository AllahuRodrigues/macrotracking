import { NextRequest, NextResponse } from "next/server";
import {
  getDailyMacroSummaries,
  getFoodEntries,
  getMacroSummaryForDate,
  getBodyMetrics,
} from "@/lib/db";
import {
  reconcileSupplementMacrosForDate,
  splitMacroEntries,
} from "@/lib/supplement-macros-sync";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "30");

  if (date) {
    await reconcileSupplementMacrosForDate(date);
    const summary = (await getMacroSummaryForDate(date)) as Record<string, number>;
    const entries = await getFoodEntries(date);
    const { fromMeals, fromSupplements } = splitMacroEntries(entries);

    return NextResponse.json({
      date,
      calories: summary.calories ?? 0,
      protein: summary.protein ?? 0,
      fat: summary.fat ?? 0,
      carbs: summary.carbs ?? 0,
      entry_count: summary.entry_count ?? entries.length,
      from_meals: fromMeals,
      from_supplements: fromSupplements,
    });
  }

  const macros = await getDailyMacroSummaries(days);
  const body = await getBodyMetrics(days);
  return NextResponse.json({ macros, body });
}
