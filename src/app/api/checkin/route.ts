import { NextRequest, NextResponse } from "next/server";
import { getDailyCheckin, getDailyCheckins, upsertDailyCheckin } from "@/lib/db";
import { todayISO } from "@/lib/timezone";
import type { DailyCheckin } from "@/lib/types";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "0");
  if (days > 0) {
    return NextResponse.json(await getDailyCheckins(days));
  }
  const d = date ?? todayISO();
  return NextResponse.json((await getDailyCheckin(d)) ?? { date: d });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as DailyCheckin;
  if (!body.date) {
    return NextResponse.json({ error: "date required" }, { status: 400 });
  }
  const existing = await getDailyCheckin(body.date);
  const merged: DailyCheckin = { ...(existing ?? {}), ...body, date: body.date };
  const saved = await upsertDailyCheckin(merged);
  return NextResponse.json(saved);
}
