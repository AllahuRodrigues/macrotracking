"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Circle, Pill, Minus, Plus } from "lucide-react";
import type { Supplement, SupplementDaySummary } from "@/lib/types";
import { groupSupplementsByTiming, isSupplementDueToday } from "@/lib/supplement-utils";
import {
  getSupplementMacroConfig,
  supplementAllowsQuantity,
  supplementTracksMacros,
} from "@/lib/supplement-macros-config";
import {
  todayISO,
  formatDateLong,
  formatWeekday,
  formatDayNum,
  subDaysISO,
} from "@/lib/utils";
import { useAccess } from "@/context/AccessProvider";
import { Card, Button } from "./ui";
import { DateNav } from "./DatePicker";

interface IntakeData {
  date: string;
  supplements: Supplement[];
  due_supplements?: Supplement[];
  taken_ids: string[];
  quantities?: Record<string, number>;
  taken: number;
  total: number;
}

interface SupplementDailyTrackerProps {
  initialDate?: string;
  compact?: boolean;
  onChange?: () => void;
}

function MacroHint({ supplement, quantity }: { supplement: Supplement; quantity: number }) {
  const config = getSupplementMacroConfig(supplement);
  if (!config) return null;
  const qty = quantity || 1;
  return (
    <span className="text-[10px] text-[var(--accent-warm)]">
      +{config.protein * qty}g P · {config.carbs * qty}g C
    </span>
  );
}

function ScoopControl({
  supplementId,
  quantity,
  onChange,
  disabled,
}: {
  supplementId: string;
  quantity: number;
  onChange: (id: string, qty: number) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-1 rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-1"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        disabled={disabled || quantity <= 1}
        onClick={() => onChange(supplementId, quantity - 1)}
        className="rounded p-1 text-[var(--muted)] hover:bg-[var(--surface)] disabled:opacity-40"
      >
        <Minus size={12} />
      </button>
      <span className="min-w-[2rem] text-center text-xs font-semibold">{quantity}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(supplementId, quantity + 1)}
        className="rounded p-1 text-[var(--muted)] hover:bg-[var(--surface)] disabled:opacity-40"
      >
        <Plus size={12} />
      </button>
      <span className="pr-1 text-[10px] text-[var(--muted)]">scoops</span>
    </div>
  );
}

export function SupplementDailyTracker({ initialDate, compact, onChange }: SupplementDailyTrackerProps) {
  const { canWrite } = useAccess();
  const [date, setDate] = useState(initialDate ?? todayISO());
  const [data, setData] = useState<IntakeData | null>(null);
  const [history, setHistory] = useState<SupplementDaySummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialDate) setDate(initialDate);
  }, [initialDate]);

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

  async function toggle(supplementId: string, currentlyTaken: boolean) {
    if (!canWrite) return;
    const qty = data?.quantities?.[supplementId] ?? 1;
    await fetch("/api/supplement-intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle",
        date,
        supplement_id: supplementId,
        taken: !currentlyTaken,
        quantity: qty,
      }),
    });
    await load();
    onChange?.();
  }

  async function setQuantity(supplementId: string, quantity: number) {
    if (!canWrite) return;
    await fetch("/api/supplement-intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "set_quantity",
        date,
        supplement_id: supplementId,
        quantity,
      }),
    });
    await load();
    onChange?.();
  }

  async function markAllTaken() {
    if (!canWrite || !data) return;
    const due = data.due_supplements ?? data.supplements.filter((s) => isSupplementDueToday(s.frequency, date));
    await fetch("/api/supplement-intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "mark_all",
        date,
        supplement_ids: due.map((s) => s.id),
      }),
    });
    await load();
    onChange?.();
  }

  const takenSet = new Set(data?.taken_ids ?? []);
  const quantities = data?.quantities ?? {};
  const dueIds = new Set(
    (data?.due_supplements ?? data?.supplements.filter((s) => isSupplementDueToday(s.frequency, date)) ?? []).map((s) => s.id)
  );
  const pct = data && data.total > 0 ? Math.round((data.taken / data.total) * 100) : 0;
  const allDone = data ? data.taken === data.total && data.total > 0 : false;
  const groups = data ? groupSupplementsByTiming(data.supplements) : [];

  const stripDays = Array.from({ length: 14 }, (_, i) => {
    const iso = subDaysISO(date, 13 - i);
    const h = history.find((x) => x.date === iso);
    return { date: iso, pct: h?.pct ?? 0, taken: h?.taken ?? 0, total: h?.total ?? data?.total ?? 0 };
  });

  function renderSupplementRow(s: Supplement, compactRow = false) {
    const taken = takenSet.has(s.id);
    const due = dueIds.has(s.id);
    const qty = quantities[s.id] ?? 1;
    const tracksMacros = supplementTracksMacros(s);
    const allowsQty = supplementAllowsQuantity(s);

    return (
      <div
        key={s.id}
        className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
          !due
            ? "border-[var(--card-border)]/60 bg-[var(--background)]/50 opacity-60"
            : taken
            ? "border-[var(--accent)]/30 bg-[var(--accent)]/5"
            : "border-[var(--card-border)] bg-[var(--background)]"
        } ${compactRow ? "text-sm" : ""}`}
      >
        <button
          type="button"
          onClick={() => due && canWrite && toggle(s.id, taken)}
          disabled={!due || !canWrite}
          className="flex min-w-0 flex-1 items-center gap-2 text-left disabled:cursor-default"
        >
          {taken
            ? <CheckCircle2 size={compactRow ? 16 : 20} className="text-[var(--accent)] shrink-0" />
            : <Circle size={compactRow ? 16 : 20} className={`shrink-0 ${due ? "text-[var(--muted)]" : "text-[var(--card-border)]"}`} />}
          <div className="min-w-0 flex-1">
            <p className={`font-medium ${taken ? "line-through opacity-70" : ""}`}>
              {s.name}
              {s.dose && !compactRow && (
                <span className="ml-1.5 text-xs font-normal text-[var(--muted)]">{s.dose}</span>
              )}
            </p>
            {!compactRow && (
              <p className="text-xs text-[var(--muted)]">
                {s.brand && `${s.brand} · `}{s.timing}
                {tracksMacros && taken && (
                  <span className="ml-2">
                    <MacroHint supplement={s} quantity={qty} />
                  </span>
                )}
              </p>
            )}
            {compactRow && tracksMacros && taken && (
              <MacroHint supplement={s} quantity={qty} />
            )}
            {!due && s.frequency === "every_2_days" && (
              <span className="text-xs text-[var(--accent-warm)]"> · skip today</span>
            )}
          </div>
        </button>
        {taken && allowsQty && (
          <ScoopControl
            supplementId={s.id}
            quantity={qty}
            onChange={setQuantity}
            disabled={!canWrite}
          />
        )}
      </div>
    );
  }

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
        {!canWrite && (
          <p className="mb-2 text-xs text-[var(--accent-warm)]">Guest mode — view only</p>
        )}
        {data && (
          <>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-2xl font-bold" style={{ color: allDone ? "var(--accent)" : undefined }}>
                {data.taken}/{data.total}
              </span>
              <span className="text-sm text-[var(--muted)]">{pct}% complete</span>
            </div>
            <div className="mb-3 h-2 overflow-hidden rounded-full bg-[var(--surface)]">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="space-y-1">
              {(data.due_supplements ?? data.supplements.filter((s) => isSupplementDueToday(s.frequency, date))).slice(0, 6).map((s) =>
                renderSupplementRow(s, true)
              )}
            </div>
          </>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Daily Supplement Intake</h2>
          <p className="text-sm text-[var(--muted)]">{formatDateLong(date)}</p>
        </div>
        <DateNav value={date} onChange={setDate} compact />
      </div>

      {!canWrite && (
        <p className="rounded-lg bg-[var(--accent-warm)]/15 px-3 py-2 text-sm text-[var(--foreground)]">
          Guest mode — you can view but not log supplements.
        </p>
      )}

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${allDone ? "bg-[var(--accent)]/15" : "bg-[var(--surface)]"}`}>
              <Pill size={24} className={allDone ? "text-[var(--accent)]" : "text-[var(--muted)]"} />
            </div>
            <div>
              <p className="text-3xl font-bold leading-none">
                {data?.taken ?? 0}
                <span className="text-lg font-normal text-[var(--muted)]"> / {data?.total ?? 0}</span>
              </p>
              <p className="mt-0.5 text-sm text-[var(--muted)]">
                {allDone ? "All supplements taken ✓" : `${pct}% complete`}
              </p>
            </div>
          </div>
          {canWrite && !allDone && data && data.total > 0 && (
            <Button variant="secondary" onClick={markAllTaken} className="!text-xs">
              Mark all taken
            </Button>
          )}
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[var(--surface)]">
          <div
            className="h-full rounded-full transition-all duration-500 bg-[var(--accent)]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </Card>

      <Card title="Last 14 Days">
        <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-14">
          {stripDays.map((d) => {
            const isSelected = d.date === date;
            const hasData = d.taken > 0;
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => setDate(d.date)}
                title={`${d.date}: ${d.taken}/${d.total} (${d.pct}%)`}
                className={`flex flex-col items-center rounded-lg border p-1.5 transition-colors ${
                  isSelected
                    ? "border-[var(--accent)] bg-[var(--accent)]/10"
                    : "border-[var(--card-border)] hover:border-[var(--muted)]"
                }`}
              >
                <span className="text-[9px] text-[var(--muted)]">
                  {formatWeekday(d.date)}
                </span>
                <span className="text-[10px] font-semibold">
                  {formatDayNum(d.date)}
                </span>
                <div
                  className={`mt-1 h-1.5 w-full rounded-full ${
                    !hasData
                      ? "bg-[var(--surface)]"
                      : d.pct === 100
                      ? "bg-[var(--accent)]"
                      : "bg-[var(--accent-warm)]"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </Card>

      {loading ? (
        <Card><p className="py-8 text-center text-sm text-[var(--muted)]">Loading…</p></Card>
      ) : (
        groups.map(({ slot, icon, supplements }) => {
          const dueInSlot = supplements.filter((s) => dueIds.has(s.id));
          const slotTaken = dueInSlot.filter((s) => takenSet.has(s.id)).length;
          const slotDone = dueInSlot.length > 0 && slotTaken === dueInSlot.length;
          return (
            <Card key={slot}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  {icon} {slot}
                </h3>
                <span className={`text-xs font-medium ${slotDone ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}>
                  {slotTaken}/{dueInSlot.length} due
                </span>
              </div>
              <div className="space-y-1">
                {supplements.map((s) => renderSupplementRow(s))}
              </div>
            </Card>
          );
        })
      )}
    </div>
  );
}
