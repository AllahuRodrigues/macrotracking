import { NextRequest, NextResponse } from "next/server";
import { getDailyMacroSummaries, getBodyMetrics, getFoodEntries } from "@/lib/db";
import { buildInsights } from "@/lib/insights";
import type { DailyMacroSummary, BodyMetric, FoodEntry } from "@/lib/types";

export async function GET(req: NextRequest) {
  const days = Math.min(120, Math.max(7, parseInt(req.nextUrl.searchParams.get("days") ?? "30")));
  const [macros, body] = await Promise.all([
    getDailyMacroSummaries(days) as Promise<DailyMacroSummary[]>,
    getBodyMetrics(days) as Promise<BodyMetric[]>,
  ]);

  const entries = (await getFoodEntries()) as FoodEntry[];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);
  const recentEntries = entries.filter((e) => new Date(e.date) >= cutoff);

  const insights = buildInsights(macros, body, recentEntries);
  return NextResponse.json(insights);
}
