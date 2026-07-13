"use client";

import { useEffect, useState } from "react";
import { Moon, Footprints, AlertTriangle, FileText } from "lucide-react";
import { Card } from "@/components/ui";
import type { DailyCheckin } from "@/lib/types";
import type { MealRisk, WeeklyReport } from "@/lib/meal-risk";

export function CheckinPanel({ date }: { date: string }) {
  const [c, setC] = useState<DailyCheckin>({ date });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/checkin?date=${date}`)
      .then((r) => r.json())
      .then((d) => setC({ date, ...d }))
      .catch(() => {});
  }, [date]);

  const save = async (patch: Partial<DailyCheckin>) => {
    const next = { ...c, ...patch, date };
    setC(next);
    setSaving(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      setC(await res.json());
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="Daily check-in" action={saving ? <span className="text-xs text-[var(--muted)]">Saving…</span> : null}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1 text-xs text-[var(--muted)]">
          <span className="flex items-center gap-1"><Moon size={12} /> Sleep hours</span>
          <input
            type="number"
            step="0.5"
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm"
            value={c.sleep_hours ?? ""}
            onChange={(e) => setC({ ...c, sleep_hours: e.target.value ? parseFloat(e.target.value) : null })}
            onBlur={() => save({ sleep_hours: c.sleep_hours })}
          />
        </label>
        <label className="space-y-1 text-xs text-[var(--muted)]">
          <span className="flex items-center gap-1"><Footprints size={12} /> Steps</span>
          <input
            type="number"
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm"
            value={c.steps ?? ""}
            onChange={(e) => setC({ ...c, steps: e.target.value ? parseInt(e.target.value, 10) : null })}
            onBlur={() => save({ steps: c.steps })}
          />
          <div className="flex gap-1">
            {[10000, 12000, 14000].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => save({ steps: n })}
                className="rounded bg-[var(--accent)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)]"
              >
                {n / 1000}k
              </button>
            ))}
          </div>
        </label>
        <label className="space-y-1 text-xs text-[var(--muted)]">
          Hunger (1–10)
          <input
            type="number"
            min={1}
            max={10}
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm"
            value={c.hunger ?? ""}
            onChange={(e) => setC({ ...c, hunger: e.target.value ? parseInt(e.target.value, 10) : null })}
            onBlur={() => save({ hunger: c.hunger })}
          />
        </label>
        <label className="space-y-1 text-xs text-[var(--muted)]">
          Stress (1–10)
          <input
            type="number"
            min={1}
            max={10}
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm"
            value={c.stress ?? ""}
            onChange={(e) => setC({ ...c, stress: e.target.value ? parseInt(e.target.value, 10) : null })}
            onBlur={() => save({ stress: c.stress })}
          />
        </label>
      </div>
    </Card>
  );
}

export function MealRiskPanel({ data }: { data: MealRisk }) {
  const color =
    data.level === "high"
      ? "border-red-500/50 bg-red-500/10"
      : data.level === "medium"
      ? "border-[var(--accent-warm)]/50 bg-[var(--accent-warm)]/10"
      : "border-[var(--accent)]/40 bg-[var(--accent)]/10";

  return (
    <Card className={color}>
      <p className="mb-1 flex items-center gap-2 text-sm font-bold">
        <AlertTriangle size={16} />
        {data.headline}
        <span className="ml-auto text-xs font-semibold opacity-80">{data.probability_pct}% risk</span>
      </p>
      <p className="mb-2 text-sm text-[var(--muted)]">{data.body}</p>
      <ul className="space-y-1 text-sm">
        {data.suggestions.map((s, i) => (
          <li key={i}>→ {s}</li>
        ))}
      </ul>
    </Card>
  );
}

export function WeeklyReportPanel({ data }: { data: WeeklyReport }) {
  return (
    <Card title="Weekly report">
      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-[var(--surface)] px-2.5 py-1">Avg {data.avg_calories} kcal</span>
        <span className="rounded-full bg-[var(--surface)] px-2.5 py-1">{data.avg_protein}g protein</span>
        <span className="rounded-full bg-[var(--surface)] px-2.5 py-1">Cal hit {data.calorie_hit_rate}%</span>
        <span className="rounded-full bg-[var(--surface)] px-2.5 py-1">Pro hit {data.protein_hit_rate}%</span>
      </div>
      <p className="mb-1 flex items-center gap-2 text-sm font-semibold">
        <FileText size={14} /> Biggest problem
      </p>
      <p className="mb-3 text-sm text-[var(--muted)]">{data.biggest_problem}</p>
      <p className="mb-1 text-sm font-semibold">Wins</p>
      <ul className="mb-3 space-y-1 text-sm text-[var(--accent)]">
        {data.wins.map((w, i) => (
          <li key={i}>✓ {w}</li>
        ))}
      </ul>
      <p className="mb-1 text-sm font-semibold">Next week</p>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-[var(--muted)]">
        {data.next_week_focus.map((f, i) => (
          <li key={i}>{f}</li>
        ))}
      </ol>
    </Card>
  );
}
