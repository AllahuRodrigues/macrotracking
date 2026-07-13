import { NextRequest, NextResponse } from "next/server";
import {
  getDailyMacroSummaries,
  getBodyMetrics,
  getFoodEntries,
  getDailyCheckin,
  getTotalWaterForDate,
} from "@/lib/db";
import { buildInsights } from "@/lib/insights";
import { buildDailyTipsPayload } from "@/lib/daily-tips";
import { todayISO } from "@/lib/utils";
import type { DailyMacroSummary, BodyMetric, FoodEntry } from "@/lib/types";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") ?? todayISO();
  const days = Math.min(120, Math.max(7, parseInt(req.nextUrl.searchParams.get("days") ?? "30")));

  const [macros, body, checkin, waterMl] = await Promise.all([
    getDailyMacroSummaries(days) as Promise<DailyMacroSummary[]>,
    getBodyMetrics(days) as Promise<BodyMetric[]>,
    getDailyCheckin(date).catch(() => null),
    getTotalWaterForDate(date).catch(() => 0),
  ]);

  const entries = (await getFoodEntries()) as FoodEntry[];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);
  const recentEntries = entries.filter((e) => new Date(e.date) >= cutoff);
  const insights = buildInsights(macros, body, recentEntries);

  const todayMacro = macros.find((m) => m.date === date);

  const payload = buildDailyTipsPayload({
    dateISO: date,
    insights,
    todayProtein: todayMacro?.protein ?? 0,
    todayCalories: todayMacro?.calories ?? 0,
    todayWaterMl: typeof waterMl === "number" ? waterMl : 0,
    sleepHours: checkin?.sleep_hours ?? null,
    stress: checkin?.stress ?? null,
    hunger: checkin?.hunger ?? null,
  });

  return NextResponse.json(payload);
}
