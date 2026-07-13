import { NextRequest, NextResponse } from "next/server";
import {
  createWorkoutSession, getSessionExercises, getSessionForDate,
  getWorkoutSessions, upsertSessionExercise,
} from "@/lib/db";
import { initialTimerFields } from "@/lib/session-timer";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "30");

  if (date) {
    const session = await getSessionForDate(date);
    if (!session) return NextResponse.json(null);
    const exercises = await getSessionExercises(session.id);
    return NextResponse.json({ session, exercises });
  }

  const sessions = await getWorkoutSessions(limit);
  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.type === "session") {
    const timer = initialTimerFields();
    const session = await createWorkoutSession({
      cardio_done: 0,
      ...body.data,
      ...timer,
      notes: timer.notes,
    });
    return NextResponse.json(session, { status: 201 });
  }

  if (body.type === "exercise") {
    const ex = await upsertSessionExercise(body.data);
    return NextResponse.json(ex, { status: 201 });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
