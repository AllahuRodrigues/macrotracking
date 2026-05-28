"use client";

import { useEffect, useState, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { FoodEntry } from "@/lib/types";
import { MACRO_COLORS, todayISO } from "@/lib/utils";
import { FoodEntryForm, FoodEntryList } from "@/components/FoodEntryForm";
import { MacroBar } from "@/components/MacroRing";
import { Card, Button } from "@/components/ui";
import { DayTypeToggle } from "@/components/DayTypeToggle";
import { useDayType } from "@/lib/useDayType";
import { GuestBanner } from "@/components/GuestBanner";
import { useAccess } from "@/context/AccessProvider";

export default function MealsPage() {
  const { canWrite } = useAccess();
  const [date, setDate] = useState(todayISO());
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [stats, setStats] = useState({
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    from_meals: { protein: 0 },
    from_supplements: { protein: 0 },
  });
  const [editEntry, setEditEntry] = useState<FoodEntry | null>(null);
  const { dayType, setDayType, goals } = useDayType();

  const load = useCallback(async () => {
    const [entriesRes, statsRes] = await Promise.all([
      fetch(`/api/entries?date=${date}`),
      fetch(`/api/stats?date=${date}`),
    ]);
    setEntries(await entriesRes.json());
    setStats(await statsRes.json());
  }, [date]);

  useEffect(() => { load(); }, [load]);

  function shiftDate(days: number) {
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split("T")[0]);
  }

  const totals = {
    calories: stats.calories ?? 0,
    protein: stats.protein ?? 0,
    fat: stats.fat ?? 0,
    carbs: stats.carbs ?? 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meals</h1>
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

      <GuestBanner />

      <Card title="Daily Totals (Food + Supplements)">
        <div className="mb-2 flex justify-between text-lg font-bold">
          <span>{Math.round(totals.calories)} kcal</span>
          <span className="text-sm font-normal text-[var(--muted)]">
            P {Math.round(totals.protein)}g · F {Math.round(totals.fat)}g · C {Math.round(totals.carbs)}g
          </span>
        </div>
        {(stats.from_supplements?.protein ?? 0) > 0 && (
          <p className="mb-2 text-xs text-[var(--accent-warm)]">
            Includes {Math.round(stats.from_supplements.protein)}g protein from supplements
            (Quest bar, whey, etc.)
          </p>
        )}
        <div className="space-y-2">
          <MacroBar label="Protein" current={totals.protein} goal={goals.protein} color={MACRO_COLORS.protein} />
          <MacroBar label="Fat" current={totals.fat} goal={goals.fat} color={MACRO_COLORS.fat} />
          <MacroBar label="Carbs" current={totals.carbs} goal={goals.carbs} color={MACRO_COLORS.carbs} />
        </div>
      </Card>

      {canWrite && (
        <FoodEntryForm
          date={date}
          onSaved={load}
          editEntry={editEntry}
          onCancelEdit={() => setEditEntry(null)}
        />
      )}

      <Card title="Food Log (Meals + Supplement Macros)">
        <FoodEntryList
          entries={entries}
          onEdit={canWrite ? setEditEntry : undefined}
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
