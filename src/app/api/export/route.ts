import { NextRequest, NextResponse } from "next/server";
import {
  getFoodEntries,
  getBodyMetrics,
  getPhotos,
  getSupplements,
  getWorkoutSessions,
  getWorkoutTemplates,
  getTemplateExercises,
  getSessionExercises,
  getDailyMacroSummaries,
  getUserProfile,
} from "@/lib/db";

/**
 * Full data export — everything the app knows, as a single JSON document.
 * Powers the "Export data" button on web and the share-sheet export in the
 * Expo app. Read-only, so it is intentionally unprotected.
 */
export async function GET(req: NextRequest) {
  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "120");

  const [profile, food, body, photos, supplements, macros, templates, sessions] =
    await Promise.all([
      getUserProfile(),
      getFoodEntries(),
      getBodyMetrics(),
      getPhotos(),
      getSupplements(false),
      getDailyMacroSummaries(days),
      getWorkoutTemplates(),
      getWorkoutSessions(200),
    ]);

  const program = await Promise.all(
    templates.map(async (t) => ({
      ...t,
      exercises: await getTemplateExercises(t.id),
    }))
  );

  const workoutSessions = await Promise.all(
    sessions.map(async (s) => ({
      ...s,
      exercises: await getSessionExercises(s.id),
    }))
  );

  const payload = {
    meta: {
      app: "MacroTrack",
      exported_at: new Date().toISOString(),
      version: 1,
      days,
    },
    profile,
    food_entries: food,
    body_metrics: body,
    photos,
    supplements,
    daily_macros: macros,
    workout_program: program,
    workout_sessions: workoutSessions,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="macrotrack-export-${new Date()
        .toISOString()
        .slice(0, 10)}.json"`,
      "Access-Control-Allow-Origin": "*",
    },
  });
}
