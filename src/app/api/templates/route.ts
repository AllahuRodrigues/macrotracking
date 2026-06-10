import { NextRequest, NextResponse } from "next/server";
import { getWorkoutTemplates, getTemplateExercises, getTemplateForDay } from "@/lib/db";

export async function GET(req: NextRequest) {
  const day = req.nextUrl.searchParams.get("day");

  if (day !== null) {
    const template = await getTemplateForDay(parseInt(day));
    if (!template) return NextResponse.json(null);
    const exercises = await getTemplateExercises(template.id);
    return NextResponse.json({ template, exercises });
  }

  const templates = await getWorkoutTemplates();
  const full = await Promise.all(
    templates.map(async (t) => ({
      template: t,
      exercises: await getTemplateExercises(t.id),
    }))
  );
  return NextResponse.json(full);
}
