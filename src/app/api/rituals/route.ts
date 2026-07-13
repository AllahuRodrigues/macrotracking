import { NextRequest, NextResponse } from "next/server";
import {
  getRitualCompletionsForDate,
  replaceRitualCompletionsForDate,
  upsertRitualCompletion,
} from "@/lib/db";
import { todayISO } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") ?? todayISO();
  const rows = await getRitualCompletionsForDate(date);
  const done: Record<string, boolean> = {};
  for (const r of rows) done[r.ritual_id] = !!r.done;
  return NextResponse.json({ date, done, rows });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const date = body.date ?? todayISO();

  if (body.ritual_id != null && typeof body.done === "boolean") {
    const row = await upsertRitualCompletion(date, body.ritual_id, body.done);
    return NextResponse.json(row);
  }

  if (body.done && typeof body.done === "object") {
    const rows = await replaceRitualCompletionsForDate(date, body.done);
    return NextResponse.json({ date, rows });
  }

  return NextResponse.json({ error: "Invalid body" }, { status: 400 });
}
