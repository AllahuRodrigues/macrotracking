import { NextRequest, NextResponse } from "next/server";
import {
  deleteWorkoutSession,
  updateWorkoutSession,
  upsertSessionExercise,
  getWorkoutSessions,
} from "@/lib/db";
import { applyTimerAction } from "@/lib/session-timer";
import type { WorkoutSession } from "@/lib/types";

async function getSessionById(id: string): Promise<WorkoutSession | null> {
  const sessions = await getWorkoutSessions(100);
  return sessions.find((s) => s.id === id) ?? null;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  if (body.type === "exercise") {
    const ex = await upsertSessionExercise({ ...body.data, id });
    return NextResponse.json(ex);
  }

  if (body.action === "pause" || body.action === "resume" || body.action === "complete") {
    const current = await getSessionById(id);
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const patch = applyTimerAction(current, body.action);
    const updated = await updateWorkoutSession(id, patch);
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  }

  const updated = await updateWorkoutSession(id, body);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteWorkoutSession(id);
  return NextResponse.json({ ok: true });
}
