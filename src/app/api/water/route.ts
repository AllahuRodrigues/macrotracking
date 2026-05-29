import { NextRequest, NextResponse } from "next/server";
import { addWaterLog, getTotalWaterForDate, resetWaterForDate } from "@/lib/db";
import { todayISO } from "@/lib/timezone";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") ?? todayISO();
  const total = await getTotalWaterForDate(date);
  return NextResponse.json({ date, total_ml: total });
}

export async function POST(req: NextRequest) {
  const { date, amount_ml } = await req.json();
  const log = await addWaterLog(date, amount_ml);
  const total = await getTotalWaterForDate(date);
  return NextResponse.json({ log, total_ml: total });
}

export async function DELETE(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  if (!date) return NextResponse.json({ error: "Missing date" }, { status: 400 });
  await resetWaterForDate(date);
  return NextResponse.json({ ok: true });
}
