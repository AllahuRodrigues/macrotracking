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
    const summary = getMacroSummaryForDate(date);
    return NextResponse.json(summary);
  }

  const macros = getDailyMacroSummaries(days);
  const body = getBodyMetrics(days);
  return NextResponse.json({ macros, body });
}
