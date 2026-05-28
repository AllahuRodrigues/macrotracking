import { NextRequest, NextResponse } from "next/server";
import { deleteFoodEntry, updateFoodEntry } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await req.json();
  const updated = updateFoodEntry(id, data);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  deleteFoodEntry(id);
  return NextResponse.json({ ok: true });
}
