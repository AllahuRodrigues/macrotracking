"use client";

import { useEffect, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Flame, Target, Award } from "lucide-react";
import type { BodyMetric } from "@/lib/types";
import { MACRO_COLORS } from "@/lib/utils";
import { JOURNEY_GOAL_WEIGHT_LBS } from "@/lib/body-journey";
import { Card } from "@/components/ui";

interface DailyMacro {
  date: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  entry_count?: number;
}

const avg = (nums: number[]) =>
  nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;

/** Count-up animation for the hero numbers. */
function useCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current;
    let raf = 0;
    let start = 0;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const t = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(from + (target - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function CountUp({ value, suffix = "", color }: { value: number; suffix?: string; color?: string }) {
  const v = useCountUp(value);
  return (
    <span style={{ color }}>
      {Math.round(v)}
      {suffix}
    </span>
  );
}

export default function StatsPage() {
  // charts want oldest→newest; API returns newest-first
  const [macros, setMacros] = useState<DailyMacro[]>([]);
  const [macrosNewestFirst, setMacrosNewestFirst] = useState<DailyMacro[]>([]);
  const [body, setBody] = useState<BodyMetric[]>([]);

  useEffect(() => {
    fetch("/api/stats?days=30")
      .then((r) => r.json())
      .then((data) => {
        const m: DailyMacro[] = data.macros ?? [];
        setMacrosNewestFirst(m);
        setMacros([...m].reverse());
        setBody((data.body ?? []).reverse());
      });
  }, []);

  const logged = macros.filter((m) => (m.entry_count ?? m.calories) > 0);
  const avgCalories = Math.round(avg(logged.map((m) => m.calories)));
  const avgProtein = Math.round(avg(logged.map((m) => m.protein)));

  // logging streak from newest day backward
  let streak = 0;
  for (const m of macrosNewestFirst) {
    if ((m.entry_count ?? m.calories) > 0) streak++;
    else break;
  }
  const adherence = macros.length ? Math.round((logged.length / macros.length) * 100) : 0;

  const last7 = logged.slice(-7);
  const prev7 = logged.slice(-14, -7);
  const calDelta = Math.round(avg(last7.map((m) => m.calories)) - avg(prev7.map((m) => m.calories)));
  const proteinDelta = Math.round(avg(last7.map((m) => m.protein)) - avg(prev7.map((m) => m.protein)));

  const pAvg = avg(logged.map((m) => m.protein));
  const cAvg = avg(logged.map((m) => m.carbs));
  const fAvg = avg(logged.map((m) => m.fat));
  const pieData = [
    { name: "Protein", value: Math.round(pAvg * 4), color: MACRO_COLORS.protein, grams: Math.round(pAvg) },
    { name: "Carbs", value: Math.round(cAvg * 4), color: MACRO_COLORS.carbs, grams: Math.round(cAvg) },
    { name: "Fat", value: Math.round(fAvg * 9), color: MACRO_COLORS.fat, grams: Math.round(fAvg) },
  ];
  const totalCal = pieData.reduce((s, d) => s + d.value, 0);

  const bestDay = [...logged].sort((a, b) => b.protein - a.protein)[0];

  const chartStyle = { fontSize: 11, fill: "#8b95a8" };

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        .fadeUp { animation: fadeUp .5s cubic-bezier(.22,1,.36,1) both; }
      `}</style>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Stats</h1>
        <p className="text-sm text-[var(--muted)]">
          Trends, streaks, and where your calories actually come from — last 30 days.
        </p>
      </div>

      {/* Hero insight tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <InsightTile icon={<Flame size={16} />} label="Logging streak" className="fadeUp" style={{ animationDelay: "0ms" }}>
          <CountUp value={streak} suffix="d" color={MACRO_COLORS.calories} />
        </InsightTile>
        <InsightTile icon={<Target size={16} />} label="Adherence" className="fadeUp" style={{ animationDelay: "60ms" }}>
          <CountUp value={adherence} suffix="%" color="#3b82f6" />
        </InsightTile>
        <InsightTile icon={<Flame size={16} />} label="Avg calories" className="fadeUp" style={{ animationDelay: "120ms" }}>
          <CountUp value={avgCalories} color={MACRO_COLORS.calories} />
        </InsightTile>
        <InsightTile icon={<Award size={16} />} label="Avg protein" className="fadeUp" style={{ animationDelay: "180ms" }}>
          <CountUp value={avgProtein} suffix="g" color={MACRO_COLORS.protein} />
        </InsightTile>
      </div>

      {/* Week over week + macro donut */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="This week vs last" className="fadeUp" style={{ animationDelay: "220ms" }}>
          <div className="space-y-3 pt-1">
            <DeltaRow label="Calories / day" delta={calDelta} unit="" goodWhenNegative />
            <DeltaRow label="Protein / day" delta={proteinDelta} unit="g" />
            {bestDay && (
              <div className="mt-2 flex items-center justify-between rounded-lg bg-[var(--accent)]/10 px-3 py-2">
                <span className="text-sm text-[var(--accent)]">Best protein day</span>
                <span className="text-sm font-bold text-[var(--accent)]">
                  {bestDay.date.slice(5)} · {Math.round(bestDay.protein)}g
                </span>
              </div>
            )}
          </div>
        </Card>

        {totalCal > 0 && (
          <Card title="Calorie sources" className="fadeUp" style={{ animationDelay: "280ms" }}>
            <div className="flex items-center gap-4">
              <div className="h-40 w-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {pieData.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#151921", border: "1px solid #252b36", borderRadius: 8 }}
                      formatter={(value) => `${value} kcal`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm" style={{ background: d.color }} />
                    <span className="text-sm font-medium">{d.name}</span>
                    <span className="ml-auto text-sm text-[var(--muted)]">
                      {d.grams}g · {Math.round((d.value / totalCal) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>

      {macros.length > 0 && (
        <>
          <Card title="Daily Calories" className="fadeUp" style={{ animationDelay: "320ms" }}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={macros}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#252b36" />
                  <XAxis dataKey="date" tick={chartStyle} tickFormatter={(d) => d.slice(5)} />
                  <YAxis tick={chartStyle} />
                  <Tooltip
                    contentStyle={{ background: "#151921", border: "1px solid #252b36", borderRadius: 8 }}
                    labelStyle={{ color: "#e8eaed" }}
                  />
                  <Bar dataKey="calories" fill={MACRO_COLORS.calories} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Macro Trends" className="fadeUp" style={{ animationDelay: "360ms" }}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={macros}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#252b36" />
                  <XAxis dataKey="date" tick={chartStyle} tickFormatter={(d) => d.slice(5)} />
                  <YAxis tick={chartStyle} />
                  <Tooltip contentStyle={{ background: "#151921", border: "1px solid #252b36", borderRadius: 8 }} />
                  <Legend />
                  <Line type="monotone" dataKey="protein" stroke={MACRO_COLORS.protein} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="fat" stroke={MACRO_COLORS.fat} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="carbs" stroke={MACRO_COLORS.carbs} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}

      {body.length > 0 && (
        <Card title="Weight & Body Composition" className="fadeUp" style={{ animationDelay: "400ms" }}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={body}>
                <CartesianGrid strokeDasharray="3 3" stroke="#252b36" />
                <XAxis dataKey="date" tick={chartStyle} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={chartStyle} domain={["dataMin - 5", "dataMax + 5"]} />
                <Tooltip contentStyle={{ background: "#151921", border: "1px solid #252b36", borderRadius: 8 }} />
                <Legend />
                <Line type="monotone" dataKey="weight_lbs" name={`Weight (goal ${JOURNEY_GOAL_WEIGHT_LBS})`} stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="body_fat_pct" name="Body Fat %" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="muscle_mass_lbs" name="Muscle (lbs)" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {macros.length === 0 && body.length === 0 && (
        <Card>
          <p className="py-8 text-center text-sm text-[var(--muted)]">
            Start logging meals and body readings to see your stats here.
          </p>
        </Card>
      )}
    </div>
  );
}

function InsightTile({
  icon,
  label,
  children,
  className,
  style,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <Card className={`text-center ${className ?? ""}`} style={style}>
      <div className="flex items-center justify-center gap-1.5 text-[var(--muted)]">
        {icon}
        <p className="text-xs">{label}</p>
      </div>
      <p className="mt-1 text-2xl font-bold">{children}</p>
    </Card>
  );
}

function DeltaRow({
  label,
  delta,
  unit,
  goodWhenNegative,
}: {
  label: string;
  delta: number;
  unit: string;
  goodWhenNegative?: boolean;
}) {
  const isGood = goodWhenNegative ? delta <= 0 : delta >= 0;
  const color = delta === 0 ? "#8b95a8" : isGood ? "#22c55e" : "#ef4444";
  const Icon = delta >= 0 ? TrendingUp : TrendingDown;
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <span className="flex items-center gap-1.5 text-sm font-bold" style={{ color }}>
        <Icon size={15} />
        {delta > 0 ? "+" : ""}
        {delta}
        {unit}
      </span>
    </div>
  );
}
