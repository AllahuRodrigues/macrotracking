"use client";

import { TIP_DOMAIN_LABEL, type DailyTipsPayload } from "@/lib/daily-tips";
import { Card } from "@/components/ui";
import { Sparkles } from "lucide-react";

const DOMAIN_COLOR: Record<string, string> = {
  skin: "text-amber-300 border-amber-400/30 bg-amber-400/10",
  hair: "text-violet-300 border-violet-400/30 bg-violet-400/10",
  scent: "text-cyan-300 border-cyan-400/30 bg-cyan-400/10",
  circulation: "text-rose-300 border-rose-400/30 bg-rose-400/10",
  endurance: "text-[var(--accent)] border-[var(--accent)]/30 bg-[var(--accent)]/10",
  speed: "text-orange-300 border-orange-400/30 bg-orange-400/10",
  recovery: "text-blue-300 border-blue-400/30 bg-blue-400/10",
  habits: "text-[var(--muted)] border-[var(--card-border)] bg-[var(--background)]",
};

export function TipsTodayPanel({ data }: { data: DailyTipsPayload }) {
  if (!data.tips.length) return null;

  return (
    <Card className="border-[var(--accent)]/20">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[var(--accent)]" />
            <h2 className="text-lg font-bold tracking-tight">Tips for today</h2>
          </div>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Ranked from your plan day, macros, sleep check-in, and trends — skin, scent, blood
            flow, endurance, speed, hair.
          </p>
          <p className="mt-1 text-xs font-medium text-[var(--accent)]">
            {data.day_label.split("—")[0]?.trim()} · {data.focus}
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {data.tips.map((tip, i) => (
          <div
            key={tip.id}
            className="rounded-xl border border-[var(--card-border)] bg-[var(--background)] p-3"
          >
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[var(--muted)]">{i + 1}.</span>
              <span
                className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  DOMAIN_COLOR[tip.domain] ?? DOMAIN_COLOR.habits
                }`}
              >
                {TIP_DOMAIN_LABEL[tip.domain]}
              </span>
              {tip.priority === "high" && (
                <span className="text-[10px] font-semibold uppercase text-[var(--accent-warm)]">
                  Priority
                </span>
              )}
            </div>
            <p className="text-sm font-semibold">{tip.title}</p>
            <p className="mt-1 text-sm text-[var(--foreground)]">{tip.action}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{tip.why}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
