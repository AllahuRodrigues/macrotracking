"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DAILY_RITUALS,
  RITUAL_CATEGORY_META,
  RITUAL_PLAYBOOK,
  GEAR_LIST,
  HARD_RULES,
  dailyRitualProgress,
  type RitualCategory,
} from "@/lib/rituals";
import { todayISO } from "@/lib/utils";
import { Card, Button } from "@/components/ui";
import { Check, Sparkles } from "lucide-react";

const STORAGE_KEY = "macro_rituals_v1";

type Store = Record<string, Record<string, boolean>>;

function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return {};
}

function saveStore(store: Store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

const CATEGORIES = Object.keys(RITUAL_CATEGORY_META) as RitualCategory[];

export function RitualsPanel({ date = todayISO() }: { date?: string }) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState<"today" | "playbook" | "kit">("today");

  const refresh = useCallback(() => {
    const store = loadStore();
    setDone(store[date] ?? {});
  }, [date]);

  function toggle(id: string) {
    const store = loadStore();
    const day = { ...(store[date] ?? {}) };
    day[id] = !day[id];
    store[date] = day;
    saveStore(store);
    setDone(day);
    fetch("/api/rituals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, ritual_id: id, done: day[id] }),
    }).catch(() => undefined);
  }

  useEffect(() => {
    refresh();
    fetch(`/api/rituals?date=${date}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.done && typeof data.done === "object") {
          const merged = { ...(loadStore()[date] ?? {}), ...data.done };
          const store = loadStore();
          store[date] = merged;
          saveStore(store);
          setDone(merged);
        }
      })
      .catch(() => undefined);
  }, [date, refresh]);

  function clearDay() {
    const store = loadStore();
    store[date] = {};
    saveStore(store);
    setDone({});
    fetch("/api/rituals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, done: {} }),
    }).catch(() => undefined);
  }

  const progress = dailyRitualProgress(done);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <Sparkles size={20} className="text-[var(--accent)]" />
            Rituals
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Look sharp · smell good · gums & eyes · zero Zyns · more muscle, less fat
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[var(--accent)]">{progress.pct}%</p>
          <p className="text-xs text-[var(--muted)]">
            {progress.done}/{progress.total} today
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
        <p className="text-sm font-semibold text-red-300">Hard rule — no Zyns</p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Nicotine pouches are out for gums, vessels, sleep, and the cut. Craving → water, gum, walk.
        </p>
      </div>

      <div className="flex gap-2">
        {(
          [
            ["today", "Today"],
            ["playbook", "Playbook"],
            ["kit", "Kit"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`min-h-[40px] rounded-lg px-3 py-2 text-sm font-semibold ${
              tab === key
                ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                : "bg-[var(--card)] text-[var(--muted)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "today" && (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Daily checklist · {date}
            </p>
            <Button variant="ghost" onClick={clearDay}>
              Reset day
            </Button>
          </div>
          <div className="space-y-2">
            {DAILY_RITUALS.map((r) => {
              const on = !!done[r.id];
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggle(r.id)}
                  className={`flex w-full min-h-[52px] items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                    on
                      ? "border-[var(--accent)]/40 bg-[var(--accent)]/10"
                      : "border-[var(--card-border)] bg-[var(--background)]"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                      on
                        ? "border-[var(--accent)] bg-[var(--accent)] text-black"
                        : "border-[var(--card-border)]"
                    }`}
                  >
                    {on ? <Check size={12} strokeWidth={3} /> : null}
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-sm font-semibold ${on ? "text-[var(--accent)]" : ""}`}>
                      {r.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-[var(--muted)]">{r.detail}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {tab === "playbook" && (
        <div className="space-y-4">
          {HARD_RULES.map((rule) => (
            <p key={rule} className="text-sm text-[var(--muted)]">
              · {rule}
            </p>
          ))}
          {CATEGORIES.filter((c) => c !== "kit").map((cat) => (
            <Card key={cat} title={RITUAL_CATEGORY_META[cat].label}>
              <p className="mb-3 text-xs text-[var(--muted)]">{RITUAL_CATEGORY_META[cat].blurb}</p>
              <div className="space-y-3">
                {RITUAL_PLAYBOOK.filter((r) => r.category === cat && !r.daily).map((r) => (
                  <div key={r.id}>
                    <p className="text-sm font-semibold">{r.title}</p>
                    <p className="text-xs text-[var(--muted)]">{r.detail}</p>
                  </div>
                ))}
                {RITUAL_PLAYBOOK.filter((r) => r.category === cat && !r.daily).length === 0 && (
                  <p className="text-xs text-[var(--muted)]">See Today checklist for daily items.</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === "kit" && (
        <Card title="Things to have">
          <p className="mb-3 text-xs text-[var(--muted)]">{RITUAL_CATEGORY_META.kit.blurb}</p>
          <ul className="space-y-2">
            {GEAR_LIST.map((g) => (
              <li
                key={g.item}
                className="flex items-start justify-between gap-3 rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2.5 text-sm"
              >
                <span className="font-medium">{g.item}</span>
                <span className="shrink-0 text-xs text-[var(--muted)]">{g.why}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
