import { NextRequest, NextResponse } from "next/server";
import { deleteWorkoutSession, updateWorkoutSession, upsertSessionExercise } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  if (body.type === "exercise") {
    const ex = upsertSessionExercise({ ...body.data, id });
    return NextResponse.json(ex);
  }

  const updated = updateWorkoutSession(id, body);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  deleteWorkoutSession(id);
  return NextResponse.json({ ok: true });
}
