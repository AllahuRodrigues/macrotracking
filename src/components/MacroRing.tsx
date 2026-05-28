import { pct, formatNumber } from "@/lib/utils";

interface MacroRingProps {
  label: string;
  current: number;
  goal: number;
  unit?: string;
  color: string;
}

export function MacroRing({ label, current, goal, unit = "g", color }: MacroRingProps) {
  const percent = pct(current, goal);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-24 w-24">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 88 88">
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke="var(--card-border)"
            strokeWidth="6"
          />
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold">{percent}%</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs text-[var(--muted)]">{label}</p>
        <p className="text-sm font-semibold">
          {formatNumber(current, unit === "kcal" ? 0 : 0)}
          {unit === "kcal" ? "" : unit}
          <span className="text-[var(--muted)] font-normal"> / {goal}{unit === "kcal" ? "" : unit}</span>
        </p>
      </div>
    </div>
  );
}

interface MacroBarProps {
  label: string;
  current: number;
  goal: number;
  color: string;
  unit?: string;
}

export function MacroBar({ label, current, goal, color, unit = "g" }: MacroBarProps) {
  const percent = pct(current, goal);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-[var(--muted)]">{label}</span>
        <span>
          <span className="font-semibold">{formatNumber(current)}</span>
          <span className="text-[var(--muted)]"> / {goal}{unit}</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--card-border)]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
