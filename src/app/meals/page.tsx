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

export default function MealsPage() {
  const [date, setDate] = useState(todayISO());
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [editEntry, setEditEntry] = useState<FoodEntry | null>(null);
  const { dayType, setDayType, goals } = useDayType();

  const load = useCallback(async () => {
    const res = await fetch(`/api/entries?date=${date}`);
    setEntries(await res.json());
  }, [date]);

  useEffect(() => { load(); }, [load]);

  function shiftDate(days: number) {
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split("T")[0]);
  }

  const totals = entries.reduce(
    (t, e) => ({
      calories: t.calories + e.calories,
      protein: t.protein + e.protein,
      fat: t.fat + e.fat,
      carbs: t.carbs + e.carbs,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );

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

      <Card title="Daily Totals">
        <div className="mb-2 flex justify-between text-lg font-bold">
          <span>{Math.round(totals.calories)} kcal</span>
          <span className="text-sm font-normal text-[var(--muted)]">
            P {Math.round(totals.protein)}g · F {Math.round(totals.fat)}g · C {Math.round(totals.carbs)}g
          </span>
        </div>
        <div className="space-y-2">
          <MacroBar label="Protein" current={totals.protein} goal={goals.protein} color={MACRO_COLORS.protein} />
          <MacroBar label="Fat" current={totals.fat} goal={goals.fat} color={MACRO_COLORS.fat} />
          <MacroBar label="Carbs" current={totals.carbs} goal={goals.carbs} color={MACRO_COLORS.carbs} />
        </div>
      </Card>

      <FoodEntryForm
        date={date}
        onSaved={load}
        editEntry={editEntry}
        onCancelEdit={() => setEditEntry(null)}
      />

      <Card title="Food Log">
        <FoodEntryList
          entries={entries}
          onEdit={setEditEntry}
          onDelete={async (id) => {
            await fetch(`/api/entries/${id}`, { method: "DELETE" });
            load();
          }}
        />
      </Card>
    </div>
  );
}
