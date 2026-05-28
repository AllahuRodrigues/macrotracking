import { NextRequest, NextResponse } from "next/server";
import { getWorkoutTemplates, getTemplateExercises, getTemplateForDay } from "@/lib/db";

export async function GET(req: NextRequest) {
  const day = req.nextUrl.searchParams.get("day");

  if (day !== null) {
    const template = getTemplateForDay(parseInt(day));
    if (!template) return NextResponse.json(null);
    const exercises = getTemplateExercises(template.id);
    return NextResponse.json({ template, exercises });
  }

  const templates = getWorkoutTemplates();
  const full = templates.map((t) => ({
    template: t,
    exercises: getTemplateExercises(t.id),
  }));
  return NextResponse.json(full);
}
