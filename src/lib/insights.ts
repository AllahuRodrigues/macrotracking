/**
 * Phase-1 sports-science insights: weight trends, adherence, execution score,
 * adaptive TDEE, and plain-language coaching. Interpretable — no black-box ML.
 */

import type { BodyMetric, DailyMacroSummary, FoodEntry } from "./types";
import { WORKOUT_DAY_GOALS } from "./types";
import { JOURNEY_GOAL_WEIGHT_LBS } from "./body-journey";

export type DailyMacro = DailyMacroSummary & { entry_count?: number };

export type WeightTrend = {
  latest_raw: number | null;
  latest_date: string | null;
  rolling_7d: number | null;
  ewma: number | null;
  weekly_rate_lbs: number | null;
  weekly_rate_pct: number | null;
  confidence: "low" | "moderate" | "high";
  noise_vs_trend: number | null;
  days_since_new_low: number | null;
  projected_low_14d: number | null;
};

export type AdherenceStats = {
  days_logged: number;
  days_in_window: number;
  logging_rate_pct: number;
  calorie_hit_rate_pct: number;
  protein_hit_rate_pct: number;
  fat_overshoot_rate_pct: number;
  avg_calories: number;
  avg_protein: number;
  avg_fat: number;
  calorie_std_dev: number;
  calorie_target: number;
  avg_overshoot: number;
  streak_days: number;
  weekend_avg_calories: number | null;
  weekday_avg_calories: number | null;
};

export type ExecutionScore = {
  total: number;
  calories: number;
  protein: number;
  logging: number;
  consistency: number;
  grade: "A" | "B" | "C" | "D" | "F";
  label: string;
};

export type TdeeEstimate = {
  maintenance_kcal: number | null;
  estimated_7d: number | null;
  confidence: "low" | "moderate" | "high";
  realized_deficit: number | null;
  data_quality: number;
};

export type CoachingInsight = {
  headline: string;
  body: string;
  priority: "high" | "medium" | "low";
  category: "nutrition" | "weight" | "training" | "logging";
  certainty: "low" | "moderate" | "high";
};

export type AnomalyFlag = {
  type: string;
  message: string;
  severity: "info" | "warn";
};

export type InsightsPayload = {
  generated_at: string;
  weight: WeightTrend;
  adherence: AdherenceStats;
  execution: ExecutionScore;
  tdee: TdeeEstimate;
  coaching: CoachingInsight[];
  anomalies: AnomalyFlag[];
  goal: {
    target_lbs: number;
    predicted_range_30d: [number, number] | null;
    reach_goal_probability_pct: number | null;
  };
};

const CAL_TARGET = WORKOUT_DAY_GOALS.calories;
const PROTEIN_TARGET = WORKOUT_DAY_GOALS.protein;
const FAT_TARGET = WORKOUT_DAY_GOALS.fat;

function avg(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

function stdDev(nums: number[]): number {
  if (nums.length < 2) return 0;
  const m = avg(nums);
  return Math.sqrt(nums.reduce((s, n) => s + (n - m) ** 2, 0) / (nums.length - 1));
}

function isWeekend(iso: string): boolean {
  const d = new Date(iso + "T12:00:00").getDay();
  return d === 0 || d === 6;
}

/** Exponentially weighted moving average (span ≈ 7 days). */
export function computeEwma(weights: { date: string; value: number }[], span = 7): number | null {
  if (!weights.length) return null;
  const alpha = 2 / (span + 1);
  let ewma = weights[0].value;
  for (let i = 1; i < weights.length; i++) ewma = alpha * weights[i].value + (1 - alpha) * ewma;
  return Math.round(ewma * 10) / 10;
}

export function computeWeightTrend(metrics: BodyMetric[]): WeightTrend {
  const withWeight = [...metrics]
    .filter((m) => m.weight_lbs != null)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (!withWeight.length) {
    return {
      latest_raw: null,
      latest_date: null,
      rolling_7d: null,
      ewma: null,
      weekly_rate_lbs: null,
      weekly_rate_pct: null,
      confidence: "low",
      noise_vs_trend: null,
      days_since_new_low: null,
      projected_low_14d: null,
    };
  }

  const latest = withWeight[withWeight.length - 1];
  const last7 = withWeight.slice(-7);
  const rolling7 = avg(last7.map((m) => m.weight_lbs!));
  const ewma = computeEwma(withWeight.map((m) => ({ date: m.date, value: m.weight_lbs! })));

  let weeklyRate: number | null = null;
  if (withWeight.length >= 2) {
    const oldest = withWeight[Math.max(0, withWeight.length - 14)];
    const days = Math.max(
      1,
      (new Date(latest.date).getTime() - new Date(oldest.date).getTime()) / 86_400_000
    );
    weeklyRate = ((latest.weight_lbs! - oldest.weight_lbs!) / days) * 7;
    weeklyRate = Math.round(weeklyRate * 100) / 100;
  }

  const noise =
    latest.weight_lbs != null && ewma != null
      ? Math.round((latest.weight_lbs - ewma) * 10) / 10
      : null;

  let daysSinceLow: number | null = null;
  const minW = Math.min(...withWeight.map((m) => m.weight_lbs!));
  for (let i = withWeight.length - 1; i >= 0; i--) {
    if (withWeight[i].weight_lbs! <= minW + 0.1) {
      daysSinceLow = Math.floor(
        (new Date(latest.date).getTime() - new Date(withWeight[i].date).getTime()) / 86_400_000
      );
      break;
    }
  }

  const confidence: WeightTrend["confidence"] =
    withWeight.length >= 14 ? "high" : withWeight.length >= 7 ? "moderate" : "low";

  const projected =
    ewma != null && weeklyRate != null
      ? Math.round((ewma + (weeklyRate / 7) * 14) * 10) / 10
      : null;

  return {
    latest_raw: latest.weight_lbs ?? null,
    latest_date: latest.date,
    rolling_7d: Math.round(rolling7 * 10) / 10,
    ewma,
    weekly_rate_lbs: weeklyRate,
    weekly_rate_pct:
      ewma && weeklyRate ? Math.round((weeklyRate / ewma) * 1000) / 10 : null,
    confidence,
    noise_vs_trend: noise,
    days_since_new_low: daysSinceLow,
    projected_low_14d: projected,
  };
}

export function computeAdherence(macros: DailyMacro[], targetCal = CAL_TARGET): AdherenceStats {
  const logged = macros.filter((m) => (m.entry_count ?? 0) > 0 || m.calories > 0);
  const cals = logged.map((m) => m.calories);
  const within10 = logged.filter(
    (m) => Math.abs(m.calories - targetCal) <= targetCal * 0.1
  ).length;
  const proteinHit = logged.filter((m) => m.protein >= PROTEIN_TARGET).length;
  const fatOver = logged.filter((m) => m.fat > FAT_TARGET).length;

  let streak = 0;
  const sorted = [...macros].sort((a, b) => b.date.localeCompare(a.date));
  for (const m of sorted) {
    if ((m.entry_count ?? 0) > 0 || m.calories > 0) streak++;
    else break;
  }

  const weekend = logged.filter((m) => isWeekend(m.date));
  const weekday = logged.filter((m) => !isWeekend(m.date));

  return {
    days_logged: logged.length,
    days_in_window: macros.length,
    logging_rate_pct: macros.length ? Math.round((logged.length / macros.length) * 100) : 0,
    calorie_hit_rate_pct: logged.length ? Math.round((within10 / logged.length) * 100) : 0,
    protein_hit_rate_pct: logged.length ? Math.round((proteinHit / logged.length) * 100) : 0,
    fat_overshoot_rate_pct: logged.length ? Math.round((fatOver / logged.length) * 100) : 0,
    avg_calories: Math.round(avg(cals)),
    avg_protein: Math.round(avg(logged.map((m) => m.protein))),
    avg_fat: Math.round(avg(logged.map((m) => m.fat))),
    calorie_std_dev: Math.round(stdDev(cals)),
    calorie_target: targetCal,
    avg_overshoot: Math.round(avg(cals) - targetCal),
    streak_days: streak,
    weekend_avg_calories: weekend.length ? Math.round(avg(weekend.map((m) => m.calories))) : null,
    weekday_avg_calories: weekday.length ? Math.round(avg(weekday.map((m) => m.calories))) : null,
  };
}

export function computeExecutionScore(adherence: AdherenceStats): ExecutionScore {
  const calScore = Math.max(
    0,
    100 - Math.abs(adherence.avg_overshoot) * 0.15 - adherence.calorie_std_dev * 0.05
  );
  const proteinScore = Math.min(100, (adherence.protein_hit_rate_pct / 100) * 100);
  const loggingScore = adherence.logging_rate_pct;
  const consistencyScore = Math.max(0, 100 - adherence.calorie_std_dev * 0.08);

  const total = Math.round(
    calScore * 0.3 +
      proteinScore * 0.2 +
      loggingScore * 0.2 +
      consistencyScore * 0.15 +
      Math.min(100, adherence.streak_days * 10) * 0.15
  );

  const grade =
    total >= 85 ? "A" : total >= 70 ? "B" : total >= 55 ? "C" : total >= 40 ? "D" : "F";
  const label =
    total >= 85
      ? "Elite execution"
      : total >= 70
      ? "Solid — tighten calories"
      : total >= 55
      ? "Inconsistent — fix evenings"
      : "High variance — focus adherence";

  return {
    total: Math.min(100, total),
    calories: Math.round(calScore),
    protein: Math.round(proteinScore),
    logging: Math.round(loggingScore),
    consistency: Math.round(consistencyScore),
    grade,
    label,
  };
}

/** Simple adaptive TDEE from intake + weight change (not naive 3500 rule). */
export function estimateTdee(
  macros: DailyMacro[],
  weightTrend: WeightTrend
): TdeeEstimate {
  const logged = macros.filter((m) => m.calories > 0);
  const avgIntake = avg(logged.map((m) => m.calories));
  const dataQuality = Math.min(100, logged.length * 8);

  if (logged.length < 5 || weightTrend.weekly_rate_lbs == null) {
    return {
      maintenance_kcal: logged.length >= 3 ? Math.round(avgIntake) : null,
      estimated_7d: logged.length >= 3 ? Math.round(avgIntake) : null,
      confidence: "low",
      realized_deficit: null,
      data_quality: dataQuality,
    };
  }

  // ~3500 kcal/lb is a rough anchor; blend with observed rate for personalization
  const lbPerWeek = weightTrend.weekly_rate_lbs;
  const dailyEnergyFromWeight = (lbPerWeek * 3500) / 7;
  const maintenance = Math.round(avgIntake - dailyEnergyFromWeight);
  const realizedDeficit = Math.round(-dailyEnergyFromWeight);

  return {
    maintenance_kcal: maintenance,
    estimated_7d: maintenance,
    confidence: logged.length >= 14 ? "moderate" : "low",
    realized_deficit: realizedDeficit,
    data_quality: dataQuality,
  };
}

export function detectAnomalies(entries: FoodEntry[]): AnomalyFlag[] {
  const flags: AnomalyFlag[] = [];
  const byDate = new Map<string, FoodEntry[]>();
  for (const e of entries) {
    if (!byDate.has(e.date)) byDate.set(e.date, []);
    byDate.get(e.date)!.push(e);
  }

  for (const [, dayEntries] of byDate) {
    const suppMacros = dayEntries.filter((e) => e.notes?.includes("__supplement_macro__"));
    const manualShakes = dayEntries.filter(
      (e) =>
        e.name.toLowerCase().includes("shake") ||
        e.name.toLowerCase().includes("whey") ||
        e.name.toLowerCase().includes("quest")
    );
    if (suppMacros.length && manualShakes.length) {
      flags.push({
        type: "duplicate_macros",
        message: "Possible double-count: supplement checkboxes + manual shake/bar on same day.",
        severity: "warn",
      });
      break;
    }
  }

  for (const e of entries) {
    if (e.calories > 4000 || e.protein > 150) {
      flags.push({
        type: "extreme_entry",
        message: `"${e.name.slice(0, 40)}" looks unusually high — verify portion.`,
        severity: "info",
      });
    }
  }

  return flags.slice(0, 5);
}

export function generateCoaching(
  adherence: AdherenceStats,
  weight: WeightTrend,
  execution: ExecutionScore,
  tdee: TdeeEstimate
): CoachingInsight[] {
  const out: CoachingInsight[] = [];

  if (adherence.avg_overshoot > 200) {
    out.push({
      headline: "Calorie variance is your #1 bottleneck",
      body: `You're averaging ${adherence.avg_overshoot} kcal above target with ±${adherence.calorie_std_dev} kcal swing. Fixing evenings beats adding cardio.`,
      priority: "high",
      category: "nutrition",
      certainty: adherence.days_logged >= 7 ? "high" : "moderate",
    });
  }

  if (adherence.fat_overshoot_rate_pct > 70) {
    out.push({
      headline: "Fat is running high almost every day",
      body: `Fat exceeded ${FAT_TARGET}g on ${adherence.fat_overshoot_rate_pct}% of logged days (avg ${adherence.avg_fat}g). Restaurant meals and oils are the usual culprits.`,
      priority: "high",
      category: "nutrition",
      certainty: "moderate",
    });
  }

  if (weight.weekly_rate_lbs != null && weight.weekly_rate_lbs < -0.3) {
    out.push({
      headline: `Trend: ${Math.abs(weight.weekly_rate_lbs).toFixed(2)} lb/week`,
      body: weight.noise_vs_trend != null && Math.abs(weight.noise_vs_trend) > 1.5
        ? `Scale ${weight.latest_raw} lb but trend ~${weight.ewma} lb (${weight.noise_vs_trend > 0 ? "+" : ""}${weight.noise_vs_trend} lb noise). Judge the 7-day average.`
        : `Estimated true weight ~${weight.ewma ?? weight.rolling_7d} lb. Keep protein high to protect muscle.`,
      priority: "medium",
      category: "weight",
      certainty: weight.confidence,
    });
  }

  if (adherence.weekend_avg_calories && adherence.weekday_avg_calories) {
    const diff = adherence.weekend_avg_calories - adherence.weekday_avg_calories;
    if (diff > 300) {
      out.push({
        headline: "Weekends erase weekday deficit",
        body: `Weekend avg ${adherence.weekend_avg_calories} kcal vs weekday ${adherence.weekday_avg_calories} kcal (+${diff}). No alcohol or blowouts for the 21-day block.`,
        priority: "high",
        category: "nutrition",
        certainty: "moderate",
      });
    }
  }

  if (execution.total < 60) {
    out.push({
      headline: `Execution score: ${execution.total}/100 (${execution.grade})`,
      body: execution.label + ". Hit calories ±10% and 200g protein before optimizing anything else.",
      priority: "high",
      category: "logging",
      certainty: "high",
    });
  }

  if (tdee.realized_deficit != null && tdee.realized_deficit > 0) {
    out.push({
      headline: `Realized deficit ~${tdee.realized_deficit} kcal/day`,
      body: tdee.maintenance_kcal
        ? `Estimated maintenance ~${tdee.maintenance_kcal} kcal. You're eating ${adherence.avg_calories} on average.`
        : "Need more weigh-ins for a tighter TDEE estimate.",
      priority: "low",
      category: "weight",
      certainty: tdee.confidence,
    });
  }

  if (!out.length) {
    out.push({
      headline: "Keep logging — models need data",
      body: "Log every meal for 30 days to unlock lagged correlations and meal-risk predictions.",
      priority: "medium",
      category: "logging",
      certainty: "high",
    });
  }

  return out.slice(0, 4);
}

export function buildInsights(
  macros: DailyMacro[],
  body: BodyMetric[],
  entries: FoodEntry[] = []
): InsightsPayload {
  const weight = computeWeightTrend(body);
  const adherence = computeAdherence(macros);
  const execution = computeExecutionScore(adherence);
  const tdee = estimateTdee(macros, weight);
  const coaching = generateCoaching(adherence, weight, execution, tdee);
  const anomalies = detectAnomalies(entries);

  let predicted: [number, number] | null = null;
  let prob: number | null = null;
  if (weight.ewma != null && weight.weekly_rate_lbs != null) {
    const in30 = weight.ewma + (weight.weekly_rate_lbs / 7) * 30;
    const spread = Math.abs(weight.weekly_rate_lbs) * 2;
    predicted = [
      Math.round((in30 - spread) * 10) / 10,
      Math.round((in30 + spread) * 10) / 10,
    ];
    const weeksToGoal = (weight.ewma - JOURNEY_GOAL_WEIGHT_LBS) / Math.abs(weight.weekly_rate_lbs);
    prob = weeksToGoal > 0 && weeksToGoal < 8 ? Math.round(Math.max(5, 80 - weeksToGoal * 10)) : weeksToGoal <= 0 ? 85 : 5;
  }

  return {
    generated_at: new Date().toISOString(),
    weight,
    adherence,
    execution,
    tdee,
    coaching,
    anomalies,
    goal: {
      target_lbs: JOURNEY_GOAL_WEIGHT_LBS,
      predicted_range_30d: predicted,
      reach_goal_probability_pct: prob,
    },
  };
}
