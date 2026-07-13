"use client";

import { TrendingDown, Target, AlertTriangle, Brain } from "lucide-react";
import { Card } from "@/components/ui";
import type { InsightsPayload } from "@/lib/insights";

const GRADE_C: Record<string, string> = {
  A: "text-[var(--accent)]",
  B: "text-green-400",
  C: "text-[var(--accent-warm)]",
  D: "text-orange-400",
  F: "text-red-400",
};

export function InsightsPanel({ data }: { data: InsightsPayload }) {
  const { execution, weight, adherence, coaching, anomalies } = data;
  const top = coaching[0];

  return (
    <div className="space-y-4">
      <Card className="border-[var(--accent)]/30 !p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">Execution Score</p>
            <div className="mt-1 flex items-baseline gap-3">
              <span className={`text-4xl font-black ${GRADE_C[execution.grade]}`}>
                {execution.total}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${GRADE_C[execution.grade]} bg-[var(--surface)]`}>
                {execution.grade}
              </span>
            </div>
            <p className="text-sm text-[var(--muted)]">{execution.label}</p>
          </div>
          {weight.ewma != null && (
            <div className="text-right">
              <p className="text-xs text-[var(--muted)]">Trend weight</p>
              <p className="text-2xl font-bold">{weight.ewma} lb</p>
              {weight.weekly_rate_lbs != null && (
                <p className={`text-sm font-medium ${weight.weekly_rate_lbs < 0 ? "text-[var(--accent)]" : "text-red-400"}`}>
                  <TrendingDown className="mr-1 inline" size={14} />
                  {weight.weekly_rate_lbs.toFixed(2)} lb/wk
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatPill label="Cal ±10%" value={`${adherence.calorie_hit_rate_pct}%`} />
          <StatPill label="Protein 200g" value={`${adherence.protein_hit_rate_pct}%`} />
          <StatPill label="Streak" value={`${adherence.streak_days}d`} />
          <StatPill label="Avg intake" value={`${adherence.avg_calories}`} />
        </div>

        {top && (
          <div className="mt-4 rounded-lg border-l-4 border-[var(--accent-warm)] bg-[var(--accent-warm)]/10 p-3">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Brain size={16} className="text-[var(--accent-warm)]" />
              {top.headline}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{top.body}</p>
          </div>
        )}
      </Card>

      {anomalies.length > 0 && (
        <Card className="border-[var(--accent-warm)]/40">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle size={16} className="text-[var(--accent-warm)]" />
            Data checks
          </p>
          <ul className="space-y-1 text-sm text-[var(--muted)]">
            {anomalies.map((a, i) => (
              <li key={i}>• {a.message}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2">
      <p className="text-[10px] text-[var(--muted)]">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}

export function InsightsDetailWeb({ data }: { data: InsightsPayload }) {
  const { weight, adherence, tdee, goal } = data;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {weight.latest_raw != null && (
        <Card title="Weight trend engine">
          <dl className="space-y-2 text-sm">
            <Row label="Scale" value={`${weight.latest_raw} lb`} />
            <Row label="7-day avg" value={`${weight.rolling_7d ?? "—"} lb`} />
            <Row label="EWMA trend" value={`${weight.ewma ?? "—"} lb`} />
            <Row label="Daily noise" value={weight.noise_vs_trend != null ? `${weight.noise_vs_trend} lb` : "—"} />
            <Row label="Confidence" value={weight.confidence} />
          </dl>
        </Card>
      )}
      <Card title="Adherence breakdown">
        <dl className="space-y-2 text-sm">
          <Row label="Logged days" value={`${adherence.days_logged}/${adherence.days_in_window}`} />
          <Row label="Calorie std dev" value={`±${adherence.calorie_std_dev} kcal`} />
          <Row label="Avg overshoot" value={`${adherence.avg_overshoot} kcal`} />
          <Row label="Fat target missed" value={`${adherence.fat_overshoot_rate_pct}% of days`} />
        </dl>
      </Card>
      {tdee.maintenance_kcal != null && (
        <Card title="Adaptive TDEE">
          <dl className="space-y-2 text-sm">
            <Row label="Maintenance est." value={`~${tdee.maintenance_kcal} kcal`} />
            <Row label="Realized deficit" value={tdee.realized_deficit != null ? `~${tdee.realized_deficit}/day` : "—"} />
            <Row label="Certainty" value={tdee.confidence} />
          </dl>
        </Card>
      )}
      {goal.predicted_range_30d && (
        <Card title="30-day forecast">
          <dl className="space-y-2 text-sm">
            <Row label="Weight range" value={`${goal.predicted_range_30d[0]}–${goal.predicted_range_30d[1]} lb`} />
            <Row label="Goal probability" value={goal.reach_goal_probability_pct != null ? `${goal.reach_goal_probability_pct}%` : "—"} />
          </dl>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
