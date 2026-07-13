"use client";

import { useState } from "react";
import {
  Dumbbell,
  CheckCircle2,
  Utensils,
  Moon,
  FlaskConical,
  Pill,
  TrendingUp,
  Eye,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Flame,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui";
import { todayISO } from "@/lib/utils";
import {
  PLAN_TITLE,
  PLAN_SUBTITLE,
  PLAN_DAYS,
  PLAN_START_ISO,
  PLAN_RULES,
  PLAN_EXTRAS,
  PLAN_WEEK,
  PLAN_PROGRESSION,
  PLAN_BOTTOM_LINE,
  SHAKE_PROTOCOL,
  TRAINING_DAY_TEMPLATE,
  REST_DAY_TEMPLATE,
  SUPPLEMENT_GUIDANCE,
  APPEARANCE_RULES,
  planDayFor,
  planWeekNumber,
  type PlanDay,
} from "@/lib/plan";

const VERDICT_STYLE: Record<string, string> = {
  keep: "bg-[var(--accent)]/15 text-[var(--accent)]",
  optional: "bg-blue-500/15 text-blue-400",
  review: "bg-[var(--accent-warm)]/15 text-[var(--accent-warm)]",
  avoid: "bg-red-500/15 text-red-400",
};

function dayNumberInBlock(): number {
  const start = new Date(PLAN_START_ISO + "T00:00:00").getTime();
  const now = new Date(todayISO() + "T00:00:00").getTime();
  const diff = Math.floor((now - start) / 86_400_000);
  return diff >= 0 && diff < PLAN_DAYS ? diff + 1 : 0;
}

export default function PlanPage() {
  const weekday = new Date().getDay();
  const today = planDayFor(weekday);
  const weekNo = planWeekNumber(todayISO());
  const dayNo = dayNumberInBlock();

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[#0f7a43] p-6 text-[#04140b]">
        <h1 className="text-2xl font-black tracking-tight">{PLAN_TITLE}</h1>
        <p className="mt-1 text-sm opacity-80">{PLAN_SUBTITLE}</p>
        <div className="mt-4 flex gap-2">
          <span className="rounded-lg bg-black/10 px-3 py-1.5 text-sm font-bold">
            {dayNo > 0 ? `Day ${dayNo} / ${PLAN_DAYS}` : "Pre-start"}
          </span>
          {weekNo > 0 && (
            <span className="rounded-lg bg-black/10 px-3 py-1.5 text-sm font-bold">Week {weekNo}</span>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today */}
        <Card title="Today" className="lg:col-span-2">
          <div className="flex items-center gap-2">
            <Dumbbell size={18} className="text-[var(--accent)]" />
            <h3 className="text-lg font-bold">{today.title}</h3>
          </div>
          <p className="text-sm text-[var(--muted)]">{today.focus}</p>
          <DayBlocks day={today} defaultOpen />
        </Card>

        {/* Bottom line */}
        <Card className="lg:col-span-2 border-[var(--accent)]/40">
          <div className="mb-2 flex items-center gap-2">
            <Lightbulb size={16} className="text-[var(--accent)]" />
            <span className="text-sm font-semibold">The one-sentence version</span>
          </div>
          <p className="text-sm leading-relaxed">{PLAN_BOTTOM_LINE}</p>
        </Card>

        {/* Rules */}
        <Card title="Non-negotiable daily rules">
          <ul className="space-y-2">
            {PLAN_RULES.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[var(--accent)]" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="flex items-center gap-1 rounded-full bg-[var(--accent-warm)]/15 px-2.5 py-1 text-xs font-semibold text-[var(--accent-warm)]">
              <Clock size={12} /> {PLAN_EXTRAS.trainingHoursPerDay}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-blue-500/15 px-2.5 py-1 text-xs font-semibold text-blue-400">
              <Flame size={12} /> {PLAN_EXTRAS.sauna}
            </span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">{PLAN_EXTRAS.asthmaNote}</p>
        </Card>

        {/* Progression */}
        <Card title="3-week progression">
          <div className="space-y-3">
            {PLAN_PROGRESSION.map((p) => (
              <div key={p.week}>
                <div className="flex items-center gap-2 text-sm font-bold">
                  <TrendingUp size={14} className="text-[var(--accent-warm)]" />
                  {p.week}
                </div>
                <ul className="mt-1 space-y-1 pl-5">
                  {p.points.map((pt, i) => (
                    <li key={i} className="list-disc text-xs text-[var(--muted)]">{pt}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>

        {/* Training day food */}
        <Card title="Training-day food">
          <div className="mb-2 flex items-center gap-2 text-xs text-[var(--muted)]">
            <Utensils size={14} className="text-[var(--accent)]" />
            {TRAINING_DAY_TEMPLATE.target}
          </div>
          {TRAINING_DAY_TEMPLATE.meals.map((m) => (
            <MealBlock key={m.slot} slot={m.slot} items={m.items} />
          ))}
        </Card>

        {/* Rest day food */}
        <Card title="Rest-day food">
          <div className="mb-2 flex items-center gap-2 text-xs text-[var(--muted)]">
            <Moon size={14} className="text-blue-400" />
            {REST_DAY_TEMPLATE.target}
          </div>
          {REST_DAY_TEMPLATE.meals.map((m) => (
            <MealBlock key={m.slot} slot={m.slot} items={m.items} />
          ))}
        </Card>

        {/* Shake protocol */}
        <Card title={SHAKE_PROTOCOL.title}>
          <div className="mb-2 flex items-center gap-2">
            <FlaskConical size={16} className="text-[var(--protein,#f472b6)]" />
            <span className="text-sm font-bold">{SHAKE_PROTOCOL.perServing}</span>
          </div>
          <p className="text-sm text-[var(--accent)]">{SHAKE_PROTOCOL.daily}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {SHAKE_PROTOCOL.timing.map((t, i) => (
              <span key={i} className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-xs">
                {i + 1}. {t}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[var(--muted)]">{SHAKE_PROTOCOL.note}</p>
        </Card>

        {/* Supplements */}
        <Card title="Supplements">
          <div className="space-y-3">
            {SUPPLEMENT_GUIDANCE.map((s) => (
              <div key={s.name}>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Pill size={14} className="text-[var(--muted)]" />
                    {s.name}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${VERDICT_STYLE[s.verdict]}`}>
                    {s.verdict}
                  </span>
                </div>
                <p className="mt-0.5 pl-6 text-xs text-[var(--muted)]">{s.detail}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Appearance rules */}
        <Card title="Look-better rules" className="lg:col-span-2">
          <ul className="grid gap-2 sm:grid-cols-2">
            {APPEARANCE_RULES.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Eye size={16} className="mt-0.5 shrink-0 text-blue-400" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Full week */}
      <h2 className="pt-2 text-xl font-bold tracking-tight">Full weekly split</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4, 5, 6, 0].map((wd) => {
          const d = planDayFor(wd);
          return (
            <Card key={wd}>
              <h3 className="font-bold">{d.title}</h3>
              <p className="text-xs text-[var(--muted)]">{d.focus}</p>
              <DayBlocks day={d} />
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function DayBlocks({ day, defaultOpen = false }: { day: PlanDay; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-sm text-[var(--accent)]"
      >
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        {open ? "Hide exercises" : "Show exercises"}
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          {day.warmup && <p className="text-xs italic text-[var(--muted)]">Warm-up: {day.warmup}</p>}
          {day.blocks.map((b, bi) => (
            <div key={bi}>
              {b.heading && (
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">{b.heading}</p>
              )}
              <div className="space-y-1">
                {b.exercises.map((ex, ei) => (
                  <div key={ei} className="flex items-center justify-between text-sm">
                    <span className="pr-2">{ex.name}</span>
                    <span className="shrink-0 font-semibold text-[var(--accent)]">{ex.scheme}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {day.cardio && (
            <p className="text-xs font-medium text-[var(--accent-warm)]">{day.cardio}</p>
          )}
          {day.coachNote && <p className="text-xs leading-relaxed text-[var(--muted)]">{day.coachNote}</p>}
        </div>
      )}
    </div>
  );
}

function MealBlock({ slot, items }: { slot: string; items: string[] }) {
  return (
    <div className="mb-2">
      <p className="text-sm font-semibold">{slot}</p>
      <ul className="mt-0.5 space-y-0.5 pl-4">
        {items.map((it, i) => (
          <li key={i} className="list-disc text-xs text-[var(--muted)]">{it}</li>
        ))}
      </ul>
    </div>
  );
}
