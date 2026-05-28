import { NextRequest, NextResponse } from "next/server";
import {
  getSupplementIntakeHistory,
  getSupplementIntakesForDate,
  getSupplements,
  markAllSupplementsForDate,
  toggleSupplementIntake,
} from "@/lib/db";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  const days = req.nextUrl.searchParams.get("days");

  if (days) {
    return NextResponse.json(getSupplementIntakeHistory(parseInt(days)));
  }

  if (date) {
    const intakes = getSupplementIntakesForDate(date);
    const supplements = getSupplements(true);
    const takenIds = new Set(intakes.filter((i) => i.taken).map((i) => i.supplement_id));
    return NextResponse.json({
      date,
      supplements,
      taken_ids: [...takenIds],
      taken: takenIds.size,
      total: supplements.length,
    });
  }

  return NextResponse.json({ error: "Provide date or days param" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.action === "toggle") {
    const { date, supplement_id, taken } = body;
    const result = toggleSupplementIntake(date, supplement_id, taken);
    return NextResponse.json(result);
  }

  if (body.action === "mark_all") {
    const { date, supplement_ids } = body;
    markAllSupplementsForDate(date, supplement_ids);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
