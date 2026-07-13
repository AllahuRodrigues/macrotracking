import { NextRequest, NextResponse } from "next/server";
import {
  getDailyMacroSummaries,
  getBodyMetrics,
  getMacroSummaryForDate,
} from "@/lib/db";
import { buildInsights } from "@/lib/insights";
import { computeMealRisk, buildWeeklyReport } from "@/lib/meal-risk";
import { todayISO } from "@/lib/timezone";
import type { DailyMacroSummary, BodyMetric } from "@/lib/types";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") ?? todayISO();
  const hour = parseInt(req.nextUrl.searchParams.get("hour") ?? String(new Date().getHours()));

  const [macros, body, today] = await Promise.all([
    getDailyMacroSummaries(30) as Promise<DailyMacroSummary[]>,
    getBodyMetrics(60) as Promise<BodyMetric[]>,
    getMacroSummaryForDate(date) as Promise<Record<string, number>>,
  ]);

  const insights = buildInsights(macros, body, []);
  const mealRisk = computeMealRisk(
    today?.calories ?? 0,
    today?.protein ?? 0,
    hour,
    macros
  );
  const weekly = buildWeeklyReport(macros, insights.weight.weekly_rate_lbs);

  return NextResponse.json({
    date,
    meal_risk: mealRisk,
    weekly_report: weekly,
    execution: insights.execution,
    coaching: insights.coaching,
    weight: insights.weight,
  });
}
