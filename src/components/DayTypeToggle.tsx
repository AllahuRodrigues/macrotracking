"use client";

import type { DayType } from "@/lib/types";
import { WORKOUT_DAY_GOALS, REST_DAY_GOALS, DEFAULT_GOALS } from "@/lib/types";
import { Dumbbell, Coffee, Zap } from "lucide-react";

interface DayTypeToggleProps {
  dayType: DayType | null;
  setDayType: (t: DayType | null) => void;
}

const OPTIONS: {
  value: DayType | null;
  label: string;
  icon: React.ReactNode;
  kcal: number;
  sub: string;
  color: string;
}[] = [
  {
    value: "workout",
    label: "Workout Day",
    icon: <Dumbbell size={14} />,
    kcal: WORKOUT_DAY_GOALS.calories,
    sub: `200P · 220C · 57F`,
    color: "text-[var(--accent)] border-[var(--accent)]/40 bg-[var(--accent)]/10",
  },
  {
    value: null,
    label: "Base",
    icon: <Zap size={14} />,
    kcal: DEFAULT_GOALS.calories,
    sub: `200P · 200C · 61F`,
    color: "text-blue-400 border-blue-400/40 bg-blue-400/10",
  },
  {
    value: "rest",
    label: "Rest Day",
    icon: <Coffee size={14} />,
    kcal: REST_DAY_GOALS.calories,
    sub: `200P · 165C · 70F`,
    color: "text-amber-400 border-amber-400/40 bg-amber-400/10",
  },
];

export function DayTypeToggle({ dayType, setDayType }: DayTypeToggleProps) {
  return (
    <div className="flex gap-2">
      {OPTIONS.map((opt) => {
        const active =
          opt.value === null ? dayType === null : dayType === opt.value;
        return (
          <button
            key={String(opt.value)}
            onClick={() => setDayType(opt.value)}
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl border px-2 py-2 text-center text-xs transition-all sm:flex-row sm:gap-2 sm:text-left ${
              active
                ? opt.color + " border-opacity-100"
                : "border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <span className={`shrink-0 ${active ? "" : "opacity-50"}`}>
              {opt.icon}
            </span>
            <span>
              <span className="block font-semibold leading-tight">{opt.label}</span>
              <span className="block text-[10px] opacity-70">
                {opt.kcal} kcal · {opt.sub}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
