import { NextRequest, NextResponse } from "next/server";
import {
  getDailyMacroSummaries,
  getMacroSummaryForDate,
  getBodyMetrics,
} from "@/lib/db";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "30");

  if (date) {
    const summary = await getMacroSummaryForDate(date);
    return NextResponse.json(summary);
  }

  const macros = await getDailyMacroSummaries(days);
  const body = await getBodyMetrics(days);
  return NextResponse.json({ macros, body });
}
