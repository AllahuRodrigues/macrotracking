/**
 * Meal-risk + weekly coach report helpers (Phase-1 actionable layer).
 */

import type { DailyMacroSummary } from "./types";
import { WORKOUT_DAY_GOALS } from "./types";

export type MealRisk = {
  level: "low" | "medium" | "high";
  remaining_kcal: number;
  probability_pct: number;
  headline: string;
  body: string;
  suggestions: string[];
};

export type WeeklyReport = {
  week_label: string;
  avg_calories: number;
  avg_protein: number;
  calorie_hit_rate: number;
  protein_hit_rate: number;
  biggest_problem: string;
  wins: string[];
  next_week_focus: string[];
  estimated_weight_change_lbs: number | null;
};

const CAL = WORKOUT_DAY_GOALS.calories;
const PRO = WORKOUT_DAY_GOALS.protein;

function avg(n: number[]) {
  return n.length ? n.reduce((a, b) => a + b, 0) / n.length : 0;
}

/** Predict evening overshoot risk from today's progress + history patterns. */
export function computeMealRisk(
  todayCalories: number,
  todayProtein: number,
  hour: number,
  macros: DailyMacroSummary[]
): MealRisk {
  const remaining = Math.max(0, CAL - todayCalories);
  const logged = macros.filter((m) => m.calories > 0);
  const avgDaily = avg(logged.map((m) => m.calories));
  const eveningBias =
    avgDaily > CAL + 200 ? 1.25 : avgDaily > CAL ? 1.1 : 1;

  // Later in day with lots remaining = risk of binge; early with little remaining = locked in
  let probability = 20;
  if (hour >= 17 && remaining > 900) probability = 75;
  else if (hour >= 17 && remaining > 600) probability = 55;
  else if (hour >= 20 && remaining > 400) probability = 65;
  else if (hour >= 15 && remaining < 200 && todayCalories > CAL) probability = 80;
  else if (todayCalories > CAL) probability = 70;
  else if (hour >= 18 && remaining > 700) probability = 60;
  else if (todayProtein < PRO * 0.5 && hour >= 16) probability = 45;
  probability = Math.min(95, Math.round(probability * eveningBias));

  const level: MealRisk["level"] =
    probability >= 60 ? "high" : probability >= 40 ? "medium" : "low";

  const suggestions: string[] = [];
  if (remaining > 0 && remaining < 800) {
    suggestions.push(
      `Lean dinner: chicken + veg + ~${Math.round(remaining * 0.4)} kcal rice/potato`
    );
    suggestions.push(`Shake 4 (≈220 kcal / 35g P) if protein still short`);
    if (todayProtein < PRO) {
      suggestions.push(
        `Need ~${Math.round(PRO - todayProtein)}g more protein — eggs, yogurt, or whey`
      );
    }
  } else if (remaining <= 0) {
    suggestions.push("You're at/over target — water, tea, or zero-cal only tonight");
    suggestions.push("Skip restaurant food and alcohol for the 21-day block");
  } else {
    suggestions.push("Still plenty of room — don't front-load calories before training");
  }

  const headline =
    level === "high"
      ? `${remaining} kcal left — high overshoot risk tonight`
      : level === "medium"
      ? `${remaining} kcal left — stay disciplined at dinner`
      : remaining > 0
      ? `${remaining} kcal remaining — on track`
      : `Over target by ${Math.round(todayCalories - CAL)} kcal`;

  return {
    level,
    remaining_kcal: remaining,
    probability_pct: probability,
    headline,
    body:
      level === "high"
        ? "Your history shows large evening swings. Pick one of the meals below and stop eating after."
        : "Keep logging. The biggest wins come from boring consistency, not hero cardio.",
    suggestions,
  };
}

export function buildWeeklyReport(
  macros: DailyMacroSummary[],
  weeklyRateLbs: number | null
): WeeklyReport {
  const logged = macros.filter((m) => m.calories > 0).slice(0, 7);
  const calHit = logged.filter((m) => Math.abs(m.calories - CAL) <= CAL * 0.1).length;
  const proHit = logged.filter((m) => m.protein >= PRO).length;
  const avgCal = Math.round(avg(logged.map((m) => m.calories)));
  const avgPro = Math.round(avg(logged.map((m) => m.protein)));
  const fatDays = logged.filter((m) => m.fat > 55).length;

  let biggest = "Need more logged days for a clear diagnosis.";
  if (logged.length >= 3) {
    if (avgCal > CAL + 250) biggest = `Average intake ${avgCal} kcal — ~${avgCal - CAL} over target. Evening/restaurant variance is the main leak.`;
    else if (fatDays >= logged.length * 0.7) biggest = `Fat over ${55}g on most days — oils, sauces, and restaurant meals.`;
    else if (proHit < logged.length / 2) biggest = `Protein hit ${PRO}g only ${proHit}/${logged.length} days — use the 4× shake protocol.`;
    else biggest = "Adherence is improving — protect weekends and keep logging every meal.";
  }

  const wins: string[] = [];
  if (proHit >= Math.ceil(logged.length / 2) && logged.length) wins.push(`Protein hit on ${proHit}/${logged.length} days`);
  if (calHit >= 2) wins.push(`${calHit} days within ±10% of calories`);
  if (logged.length >= 5) wins.push(`${logged.length} days logged this week`);
  if (!wins.length) wins.push("Opened the app — keep stacking days");

  const next: string[] = [
    "Hit 2,100–2,200 kcal every training day (no alcohol / pastries)",
    "Lock 200g protein via 4 shakes + eggs/yogurt",
    "12–15k steps + finish today's programmed lifts",
  ];

  return {
    week_label: "Last 7 logged days",
    avg_calories: avgCal,
    avg_protein: avgPro,
    calorie_hit_rate: logged.length ? Math.round((calHit / logged.length) * 100) : 0,
    protein_hit_rate: logged.length ? Math.round((proHit / logged.length) * 100) : 0,
    biggest_problem: biggest,
    wins,
    next_week_focus: next,
    estimated_weight_change_lbs: weeklyRateLbs,
  };
}
