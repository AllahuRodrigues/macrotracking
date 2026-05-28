import { NextRequest, NextResponse } from "next/server";
import {
  createFoodEntry,
  deleteFoodEntry,
  getFoodEntries,
  updateFoodEntry,
} from "@/lib/db";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") ?? undefined;
  const entries = await getFoodEntries(date);
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const entry = await createFoodEntry(body);
  return NextResponse.json(entry, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const updated = await updateFoodEntry(id, data);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await deleteFoodEntry(id);
  return NextResponse.json({ ok: true });
}
