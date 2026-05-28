import { NextRequest, NextResponse } from "next/server";
import {
  createWorkoutSession, getSessionExercises, getSessionForDate,
  getWorkoutSessions, upsertSessionExercise,
} from "@/lib/db";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "30");

  if (date) {
    const session = getSessionForDate(date);
    if (!session) return NextResponse.json(null);
    const exercises = getSessionExercises(session.id);
    return NextResponse.json({ session, exercises });
  }

  const sessions = getWorkoutSessions(limit);
  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.type === "session") {
    const session = createWorkoutSession(body.data);
    return NextResponse.json(session, { status: 201 });
  }

  if (body.type === "exercise") {
    const ex = upsertSessionExercise(body.data);
    return NextResponse.json(ex, { status: 201 });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
