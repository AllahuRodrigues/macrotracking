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
  getDailyCheckins,
  getSupplementIntakeHistory,
} from "@/lib/db";
import { getSupabase } from "@/lib/supabase-client";
import type { DailyMacroSummary } from "@/lib/types";
import { DAILY_RITUALS } from "@/lib/rituals";

async function getAllWaterLogs(days: number) {
  try {
    const supabase = getSupabase();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const { data, error } = await supabase
      .from("water_logs")
      .select("*")
      .gte("date", cutoff.toISOString().slice(0, 10))
      .order("date", { ascending: false });
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

async function getRitualCompletions(days: number) {
  try {
    const supabase = getSupabase();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const { data, error } = await supabase
      .from("ritual_completions")
      .select("*")
      .gte("date", cutoff.toISOString().slice(0, 10));
    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

/**
 * Full data export — meals, body, workouts+sets, check-ins, water, intakes, rituals.
 * ?date=YYYY-MM-DD → single-day snapshot (what you did / didn't).
 */
export async function GET(req: NextRequest) {
  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "120");
  const day = req.nextUrl.searchParams.get("date");

  const [
    profile,
    food,
    body,
    photos,
    supplements,
    macros,
    templates,
    sessions,
    checkins,
    intakes,
    water,
    rituals,
  ] = await Promise.all([
    getUserProfile(),
    getFoodEntries(),
    getBodyMetrics(),
    getPhotos(),
    getSupplements(false),
    getDailyMacroSummaries(days) as Promise<DailyMacroSummary[]>,
    getWorkoutTemplates(),
    getWorkoutSessions(200),
    getDailyCheckins(days).catch(() => [] as Awaited<ReturnType<typeof getDailyCheckins>>),
    getSupplementIntakeHistory(Math.min(days, 90)).catch(() => [] as unknown[]),
    getAllWaterLogs(days),
    getRitualCompletions(days),
  ]);

  const program = await Promise.all(
    templates.map(async (t) => ({
      ...t,
      exercises: await getTemplateExercises(t.id),
    }))
  );

  const workoutSessions = await Promise.all(
    sessions.map(async (s) => {
      const exercises = await getSessionExercises(s.id);
      return {
        ...s,
        exercises,
        sets_summary: exercises.map((ex) => {
          const sets = JSON.parse(ex.sets_data || "[]") as {
            set_num: number;
            weight_lbs?: number;
            reps?: number;
            rir?: number | null;
            to_failure?: boolean;
            done: boolean;
          }[];
          return {
            name: ex.name,
            prescribed: `${ex.sets_prescribed}×${ex.reps_prescribed}`,
            sets_logged: sets.length,
            sets,
            missed_sets: Math.max(0, (parseInt(ex.sets_prescribed, 10) || 0) - sets.length),
          };
        }),
      };
    })
  );

  let payload: Record<string, unknown> = {
    meta: {
      app: "MacroTrack",
      exported_at: new Date().toISOString(),
      version: 2,
      days,
      scope: day ? "day" : "range",
      date: day ?? null,
    },
    profile,
    food_entries: food,
    body_metrics: body,
    photos,
    supplements,
    supplement_intakes: intakes,
    daily_checkins: checkins,
    water_logs: water,
    ritual_completions: rituals,
    daily_macros: macros,
    workout_program: program,
    workout_sessions: workoutSessions,
  };

  if (day) {
    const foodDay = food.filter((f) => f.date === day);
    const checkinDay = checkins.find((c) => c.date === day) ?? null;
    const waterDay = water.filter((w) => (w as { date: string }).date === day);
    const ritualDoneMap = new Map(
      rituals
        .filter((r) => (r as { date: string }).date === day)
        .map((r) => [(r as { ritual_id: string }).ritual_id, !!(r as { done: number }).done])
    );
    const ritualsChecklist = DAILY_RITUALS.map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      done: ritualDoneMap.get(item.id) ?? false,
    }));
    const intakesDay = (intakes as { date?: string }[]).filter((i) => i.date === day);
    const sessionDay = workoutSessions.filter((s) => s.date === day);
    const macrosDay = macros.find((m) => m.date === day) ?? null;
    const supplementsTaken = (supplements as { id: string; name: string }[]).map((s) => {
      const logged = intakesDay.find((i) => (i as { supplement_id?: string }).supplement_id === s.id);
      return {
        id: s.id,
        name: s.name,
        taken: !!logged,
        quantity: (logged as { quantity?: number } | undefined)?.quantity ?? 0,
      };
    });

    payload = {
      meta: {
        app: "MacroTrack",
        exported_at: new Date().toISOString(),
        version: 2,
        scope: "day",
        date: day,
      },
      profile,
      day: {
        date: day,
        macros: macrosDay,
        checkin: checkinDay,
        food_entries: foodDay,
        water_logs: waterDay,
        water_total_ml: waterDay.reduce(
          (s, w) => s + Number((w as { amount_ml?: number }).amount_ml ?? 0),
          0
        ),
        supplements: supplementsTaken,
        supplement_intakes: intakesDay,
        rituals: {
          done: ritualsChecklist.filter((r) => r.done),
          missed: ritualsChecklist.filter((r) => !r.done),
          checklist: ritualsChecklist,
        },
        workout_sessions: sessionDay,
        summary: {
          meals_logged: foodDay.length,
          workout_started: sessionDay.length > 0,
          workouts_completed: sessionDay.filter(
            (s) => (s as { status?: string }).status === "completed"
          ).length,
          total_sets_logged: sessionDay.reduce(
            (n, s) =>
              n +
              ((s as { sets_summary?: { sets_logged: number }[] }).sets_summary ?? []).reduce(
                (a, ex) => a + (ex.sets_logged ?? 0),
                0
              ),
            0
          ),
          rituals_done: ritualsChecklist.filter((r) => r.done).length,
          rituals_missed: ritualsChecklist.filter((r) => !r.done).length,
          checkin_logged: !!checkinDay,
        },
      },
    };
  }

  const filename = day
    ? `macrotrack-day-${day}.json`
    : `macrotrack-export-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Access-Control-Allow-Origin": "*",
    },
  });
}
