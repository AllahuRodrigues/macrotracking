"use client";

import { useEffect, useState, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { FoodEntry, BodyMetric } from "@/lib/types";
import { MACRO_COLORS, todayISO } from "@/lib/utils";
import { MacroRing, MacroBar } from "@/components/MacroRing";
import { Card, Button } from "@/components/ui";
import { FoodEntryList } from "@/components/FoodEntryForm";
import { DayTypeToggle } from "@/components/DayTypeToggle";
import { SupplementDailyTracker } from "@/components/SupplementDailyTracker";
import { useDayType } from "@/lib/useDayType";
import { useAccess } from "@/context/AccessProvider";

export default function DashboardPage() {
  const [date, setDate] = useState(todayISO());
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [summary, setSummary] = useState({
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    fromMeals: { protein: 0, calories: 0 },
    fromSupplements: { protein: 0, calories: 0 },
  });
  const [latestBody, setLatestBody] = useState<BodyMetric | null>(null);
  const { dayType, setDayType, goals } = useDayType();
  const { canWrite } = useAccess();

  const load = useCallback(async () => {
    const [entriesRes, statsRes, bodyRes] = await Promise.all([
      fetch(`/api/entries?date=${date}`),
      fetch(`/api/stats?date=${date}`),
      fetch("/api/body?limit=1"),
    ]);
    setEntries(await entriesRes.json());
    const s = await statsRes.json();
    setSummary({
      calories: s.calories ?? 0,
      protein: s.protein ?? 0,
      fat: s.fat ?? 0,
      carbs: s.carbs ?? 0,
      fromMeals: {
        protein: s.from_meals?.protein ?? 0,
        calories: s.from_meals?.calories ?? 0,
      },
      fromSupplements: {
        protein: s.from_supplements?.protein ?? 0,
        calories: s.from_supplements?.calories ?? 0,
      },
    });
    const body = await bodyRes.json();
    setLatestBody(body[0] ?? null);
  }, [date]);

  useEffect(() => { load(); }, [load]);

  function shiftDate(days: number) {
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split("T")[0]);
  }

  const remaining = {
    calories: Math.max(0, goals.calories - summary.calories),
    protein: Math.max(0, goals.protein - summary.protein),
    fat: Math.max(0, goals.fat - summary.fat),
    carbs: Math.max(0, goals.carbs - summary.carbs),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-[var(--muted)]">
            {format(parseISO(date), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" onClick={() => shiftDate(-1)}><ChevronLeft size={18} /></Button>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--card)] px-2 py-1.5 text-sm"
          />
          <Button variant="ghost" onClick={() => shiftDate(1)}><ChevronRight size={18} /></Button>
        </div>
      </div>

      <DayTypeToggle dayType={dayType} setDayType={setDayType} />

      <Card className="!p-6">
        <div className="mb-4 text-center">
          <p className="text-sm text-[var(--muted)]">Calories Today</p>
          <p className="text-4xl font-bold" style={{ color: MACRO_COLORS.calories }}>
            {Math.round(summary.calories)}
            <span className="text-lg font-normal text-[var(--muted)]"> / {goals.calories}</span>
          </p>
          <p className="text-xs text-[var(--muted)]">{Math.round(remaining.calories)} kcal remaining</p>
          {(summary.fromSupplements.protein > 0 || summary.fromMeals.protein > 0) && (
            <p className="mt-1 text-xs text-[var(--accent-warm)]">
              Protein: {Math.round(summary.fromMeals.protein)}g food
              {summary.fromSupplements.protein > 0 && (
                <> + {Math.round(summary.fromSupplements.protein)}g supplements (bar, whey, etc.)</>
              )}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MacroRing label="Protein" current={summary.protein} goal={goals.protein} color={MACRO_COLORS.protein} />
          <MacroRing label="Fat" current={summary.fat} goal={goals.fat} color={MACRO_COLORS.fat} />
          <MacroRing label="Carbs" current={summary.carbs} goal={goals.carbs} color={MACRO_COLORS.carbs} />
          <MacroRing label="Calories" current={summary.calories} goal={goals.calories} unit="kcal" color={MACRO_COLORS.calories} />
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="Macro Breakdown">
          <div className="space-y-3">
            <MacroBar label="Protein" current={summary.protein} goal={goals.protein} color={MACRO_COLORS.protein} />
            <MacroBar label="Fat" current={summary.fat} goal={goals.fat} color={MACRO_COLORS.fat} />
            <MacroBar label="Carbs" current={summary.carbs} goal={goals.carbs} color={MACRO_COLORS.carbs} />
          </div>
        </Card>

        <Card title="Latest Body Reading">
          {latestBody ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              {latestBody.weight_lbs != null && (
                <div><p className="text-[var(--muted)] text-xs">Weight</p><p className="font-semibold">{latestBody.weight_lbs} lbs</p></div>
              )}
              {latestBody.body_fat_pct != null && (
                <div><p className="text-[var(--muted)] text-xs">Body Fat</p><p className="font-semibold">{latestBody.body_fat_pct}%</p></div>
              )}
              {latestBody.muscle_mass_lbs != null && (
                <div><p className="text-[var(--muted)] text-xs">Muscle Mass</p><p className="font-semibold">{latestBody.muscle_mass_lbs} lbs</p></div>
              )}
              {latestBody.inbody_score != null && (
                <div><p className="text-[var(--muted)] text-xs">InBody Score</p><p className="font-semibold">{latestBody.inbody_score}</p></div>
              )}
              <p className="col-span-2 text-xs text-[var(--muted)]">{latestBody.date}</p>
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">No body readings yet.</p>
          )}
          <Link href="/body" className="mt-3 inline-block text-sm text-[var(--accent)] hover:underline">
            Log body metrics →
          </Link>
        </Card>
      </div>

      <SupplementDailyTracker compact initialDate={date} onChange={load} />

      <Card
        title="Today's Intake (Food + Supplements)"
        action={
          canWrite ? (
            <Link href="/meals">
              <Button variant="secondary" className="!py-1 !text-xs">Manage</Button>
            </Link>
          ) : null
        }
      >
        <FoodEntryList
          entries={entries}
          onEdit={() => {}}
          onDelete={
            canWrite
              ? async (id) => {
                  await fetch(`/api/entries/${id}`, { method: "DELETE" });
                  load();
                }
              : undefined
          }
        />
      </Card>
    </div>
  );
}
