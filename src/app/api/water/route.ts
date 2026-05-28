import { NextRequest, NextResponse } from "next/server";
import { addWaterLog, getTotalWaterForDate, resetWaterForDate } from "@/lib/db";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") ?? new Date().toISOString().split("T")[0];
  const total = getTotalWaterForDate(date);
  return NextResponse.json({ date, total_ml: total });
}

export async function POST(req: NextRequest) {
  const { date, amount_ml } = await req.json();
  const log = addWaterLog(date, amount_ml);
  const total = getTotalWaterForDate(date);
  return NextResponse.json({ log, total_ml: total });
}

export async function DELETE(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  if (!date) return NextResponse.json({ error: "Missing date" }, { status: 400 });
  resetWaterForDate(date);
  return NextResponse.json({ ok: true });
}
