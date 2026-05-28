import { NextRequest, NextResponse } from "next/server";
import {
  getSupplementIntakeHistory,
  getSupplementIntakesForDate,
  getSupplements,
  markAllSupplementsForDate,
  toggleSupplementIntake,
} from "@/lib/db";
import { filterDueSupplements } from "@/lib/supplement-utils";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  const days = req.nextUrl.searchParams.get("days");

  if (days) {
    return NextResponse.json(await getSupplementIntakeHistory(parseInt(days)));
  }

  if (date) {
    const intakes = await getSupplementIntakesForDate(date);
    const allActive = await getSupplements(true);
    const dueToday = filterDueSupplements(allActive, date);
    const takenIds = new Set(intakes.filter((i) => i.taken).map((i) => i.supplement_id));
    const dueTaken = dueToday.filter((s) => takenIds.has(s.id)).length;
    return NextResponse.json({
      date,
      supplements: allActive,
      due_supplements: dueToday,
      taken_ids: [...takenIds],
      taken: dueTaken,
      total: dueToday.length,
    });
  }

  return NextResponse.json({ error: "Provide date or days param" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.action === "toggle") {
    const { date, supplement_id, taken } = body;
    const result = await toggleSupplementIntake(date, supplement_id, taken);
    return NextResponse.json(result);
  }

  if (body.action === "mark_all") {
    const { date, supplement_ids } = body;
    await markAllSupplementsForDate(date, supplement_ids);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
