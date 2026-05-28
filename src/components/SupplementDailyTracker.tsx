"use client";

import { useCallback, useEffect, useState } from "react";
import { format, parseISO, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, Pill } from "lucide-react";
import type { Supplement, SupplementDaySummary } from "@/lib/types";
import { groupSupplementsByTiming } from "@/lib/supplement-utils";
import { todayISO } from "@/lib/utils";
import { Card, Button } from "./ui";

interface IntakeData {
  date: string;
  supplements: Supplement[];
  taken_ids: string[];
  taken: number;
  total: number;
}

interface SupplementDailyTrackerProps {
  initialDate?: string;
  compact?: boolean;
}

export function SupplementDailyTracker({ initialDate, compact }: SupplementDailyTrackerProps) {
  const [date, setDate] = useState(initialDate ?? todayISO());
  const [data, setData] = useState<IntakeData | null>(null);
  const [history, setHistory] = useState<SupplementDaySummary[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [intakeRes, historyRes] = await Promise.all([
        fetch(`/api/supplement-intake?date=${date}`),
        fetch("/api/supplement-intake?days=14"),
      ]);
      setData(await intakeRes.json());
      setHistory(await historyRes.json());
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { load(); }, [load]);

  function shiftDate(days: number) {
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split("T")[0]);
  }

  async function toggle(supplementId: string, currentlyTaken: boolean) {
    await fetch("/api/supplement-intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle",
        date,
        supplement_id: supplementId,
        taken: !currentlyTaken,
      }),
    });
    load();
  }

  async function markAllTaken() {
    if (!data) return;
    await fetch("/api/supplement-intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "mark_all",
        date,
        supplement_ids: data.supplements.map((s) => s.id),
      }),
    });
    load();
  }

  const takenSet = new Set(data?.taken_ids ?? []);
  const pct = data && data.total > 0 ? Math.round((data.taken / data.total) * 100) : 0;
  const allDone = data ? data.taken === data.total && data.total > 0 : false;
  const groups = data ? groupSupplementsByTiming(data.supplements) : [];

  // Build 14-day strip (most recent first in history, we want chronological for display)
  const stripDays = Array.from({ length: 14 }, (_, i) => {
    const d = subDays(new Date(date + "T12:00:00"), 13 - i);
    const iso = d.toISOString().split("T")[0];
    const h = history.find((x) => x.date === iso);
    return { date: iso, pct: h?.pct ?? 0, taken: h?.taken ?? 0, total: h?.total ?? data?.total ?? 0 };
  });

  if (compact) {
    return (
      <Card
        title="Supplements Today"
        action={
          <a href="/supplements" className="text-xs text-[var(--accent)] hover:underline">
            Full tracker →
          </a>
        }
      >
        {data && (
          <>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-2xl font-bold" style={{ color: allDone ? "var(--accent)" : undefined }}>
                {data.taken}/{data.total}
              </span>
              <span className="text-sm text-[var(--muted)]">{pct}% complete</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--card-border)] mb-3">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="space-y-1">
              {data.supplements.slice(0, 5).map((s) => {
                const taken = takenSet.has(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggle(s.id, taken)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-[var(--card-border)]/50"
                  >
                    {taken
                      ? <CheckCircle2 size={16} className="text-[var(--accent)] shrink-0" />
                      : <Circle size={16} className="text-[var(--muted)] shrink-0" />}
                    <span className={taken ? "line-through opacity-60" : ""}>{s.name}</span>
                  </button>
                );
              })}
              {data.supplements.length > 5 && (
                <p className="text-xs text-[var(--muted)] pl-7">+{data.supplements.length - 5} more</p>
              )}
            </div>
          </>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Date nav */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Daily Supplement Intake</h2>
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

      {/* Progress */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${allDone ? "bg-[var(--accent)]/15" : "bg-[var(--card-border)]"}`}>
              <Pill size={24} className={allDone ? "text-[var(--accent)]" : "text-[var(--muted)]"} />
            </div>
            <div>
              <p className="text-3xl font-bold leading-none">
                {data?.taken ?? 0}
                <span className="text-lg font-normal text-[var(--muted)]"> / {data?.total ?? 0}</span>
              </p>
              <p className="text-sm text-[var(--muted)] mt-0.5">
                {allDone ? "All supplements taken ✓" : `${pct}% complete`}
              </p>
            </div>
          </div>
          {!allDone && data && data.total > 0 && (
            <Button variant="secondary" onClick={markAllTaken} className="!text-xs">
              Mark all taken
            </Button>
          )}
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[var(--card-border)]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              backgroundColor: allDone ? "var(--accent)" : pct >= 50 ? "#3b82f6" : "#f97316",
            }}
          />
        </div>
      </Card>

      {/* 14-day history strip */}
      <Card title="Last 14 Days">
        <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-14">
          {stripDays.map((d) => {
            const isSelected = d.date === date;
            const hasData = d.taken > 0;
            return (
              <button
                key={d.date}
                onClick={() => setDate(d.date)}
                title={`${d.date}: ${d.taken}/${d.total} (${d.pct}%)`}
                className={`flex flex-col items-center rounded-lg border p-1.5 transition-colors ${
                  isSelected
                    ? "border-[var(--accent)] bg-[var(--accent)]/10"
                    : "border-[var(--card-border)] hover:border-[var(--muted)]"
                }`}
              >
                <span className="text-[9px] text-[var(--muted)]">
                  {format(parseISO(d.date), "EEE")}
                </span>
                <span className="text-[10px] font-semibold">
                  {format(parseISO(d.date), "d")}
                </span>
                <div
                  className={`mt-1 h-1.5 w-full rounded-full ${
                    !hasData
                      ? "bg-[var(--card-border)]"
                      : d.pct === 100
                      ? "bg-[var(--accent)]"
                      : d.pct >= 50
                      ? "bg-blue-400"
                      : "bg-orange-400"
                  }`}
                />
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex gap-4 text-[10px] text-[var(--muted)]">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[var(--accent)]" /> 100%</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-400" /> 50%+</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-400" /> Partial</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[var(--card-border)]" /> None</span>
        </div>
      </Card>

      {/* Checklist by timing */}
      {loading ? (
        <Card><p className="py-8 text-center text-sm text-[var(--muted)]">Loading…</p></Card>
      ) : (
        groups.map(({ slot, icon, supplements }) => {
          const slotTaken = supplements.filter((s) => takenSet.has(s.id)).length;
          const slotDone = slotTaken === supplements.length;
          return (
            <Card key={slot}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  {icon} {slot}
                </h3>
                <span className={`text-xs font-medium ${slotDone ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}>
                  {slotTaken}/{supplements.length}
                </span>
              </div>
              <div className="space-y-1">
                {supplements.map((s) => {
                  const taken = takenSet.has(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggle(s.id, taken)}
                      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                        taken
                          ? "border-[var(--accent)]/30 bg-[var(--accent)]/5"
                          : "border-[var(--card-border)] bg-[var(--background)] hover:border-[var(--muted)]"
                      }`}
                    >
                      {taken
                        ? <CheckCircle2 size={20} className="text-[var(--accent)] shrink-0" />
                        : <Circle size={20} className="text-[var(--muted)] shrink-0" />}
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium ${taken ? "line-through opacity-70" : ""}`}>
                          {s.name}
                          {s.dose && <span className="ml-1.5 text-xs font-normal text-[var(--muted)]">{s.dose}</span>}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          {s.brand && `${s.brand} · `}{s.timing}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
