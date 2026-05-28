import { NextRequest, NextResponse } from "next/server";
import {
  getSupplementIntakeHistory,
  getSupplementIntakesForDate,
  getSupplements,
  markAllSupplementsForDate,
  setSupplementQuantity,
  toggleSupplementIntake,
} from "@/lib/db";
import { syncSupplementMacroEntry, reconcileSupplementMacrosForDate } from "@/lib/supplement-macros-sync";
import { filterDueSupplements } from "@/lib/supplement-utils";

async function syncMacroForSupplement(
  date: string,
  supplementId: string,
  taken: boolean,
  quantity: number
) {
  const supplements = await getSupplements(true);
  const supplement = supplements.find((s) => s.id === supplementId);
  if (supplement) {
    await syncSupplementMacroEntry(date, supplement, quantity, taken);
  }
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  const days = req.nextUrl.searchParams.get("days");

  if (days) {
    return NextResponse.json(await getSupplementIntakeHistory(parseInt(days)));
  }

  if (date) {
    await reconcileSupplementMacrosForDate(date);
    const intakes = await getSupplementIntakesForDate(date);
    const allActive = await getSupplements(true);
    const dueToday = filterDueSupplements(allActive, date);
    const takenIds = new Set(intakes.filter((i) => i.taken).map((i) => i.supplement_id));
    const quantities = Object.fromEntries(
      intakes.filter((i) => i.taken).map((i) => [i.supplement_id, i.quantity ?? 1])
    );
    const dueTaken = dueToday.filter((s) => takenIds.has(s.id)).length;
    return NextResponse.json({
      date,
      supplements: allActive,
      due_supplements: dueToday,
      taken_ids: [...takenIds],
      quantities,
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
    const quantity = body.quantity ?? 1;
    const result = await toggleSupplementIntake(date, supplement_id, taken, quantity);
    await syncMacroForSupplement(date, supplement_id, taken, quantity);
    return NextResponse.json(result);
  }

  if (body.action === "set_quantity") {
    const { date, supplement_id, quantity } = body;
    const qty = Math.max(1, Number(quantity) || 1);
    const result = await setSupplementQuantity(date, supplement_id, qty);
    if (result) {
      await syncMacroForSupplement(date, supplement_id, true, qty);
    }
    return NextResponse.json(result);
  }

  if (body.action === "mark_all") {
    const { date, supplement_ids } = body;
    await markAllSupplementsForDate(date, supplement_ids);
    for (const supplementId of supplement_ids as string[]) {
      await syncMacroForSupplement(date, supplementId, true, 1);
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
