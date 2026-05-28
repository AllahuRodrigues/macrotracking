"use client";

import { useEffect, useState } from "react";
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
} from "recharts";
import type { BodyMetric } from "@/lib/types";
import { MACRO_COLORS } from "@/lib/utils";
import { Card } from "@/components/ui";

interface DailyMacro {
  date: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export default function StatsPage() {
  const [macros, setMacros] = useState<DailyMacro[]>([]);
  const [body, setBody] = useState<BodyMetric[]>([]);

  useEffect(() => {
    fetch("/api/stats?days=30")
      .then((r) => r.json())
      .then((data) => {
        setMacros((data.macros ?? []).reverse());
        setBody((data.body ?? []).reverse());
      });
  }, []);

  const avgCalories =
    macros.length > 0
      ? Math.round(macros.reduce((s, m) => s + m.calories, 0) / macros.length)
      : 0;
  const avgProtein =
    macros.length > 0
      ? Math.round(macros.reduce((s, m) => s + m.protein, 0) / macros.length)
      : 0;

  const chartStyle = {
    fontSize: 11,
    fill: "#8b95a8",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Stats</h1>
        <p className="text-sm text-[var(--muted)]">
          Trends for macros, weight, and body composition over time.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="text-center">
          <p className="text-xs text-[var(--muted)]">Days Logged</p>
          <p className="text-2xl font-bold">{macros.length}</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-[var(--muted)]">Avg Calories</p>
          <p className="text-2xl font-bold" style={{ color: MACRO_COLORS.calories }}>{avgCalories}</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-[var(--muted)]">Avg Protein</p>
          <p className="text-2xl font-bold" style={{ color: MACRO_COLORS.protein }}>{avgProtein}g</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs text-[var(--muted)]">Body Readings</p>
          <p className="text-2xl font-bold">{body.length}</p>
        </Card>
      </div>

      {macros.length > 0 && (
        <>
          <Card title="Daily Calories">
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

          <Card title="Macro Trends">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={macros}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#252b36" />
                  <XAxis dataKey="date" tick={chartStyle} tickFormatter={(d) => d.slice(5)} />
                  <YAxis tick={chartStyle} />
                  <Tooltip
                    contentStyle={{ background: "#151921", border: "1px solid #252b36", borderRadius: 8 }}
                  />
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
        <Card title="Weight & Body Composition">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={body}>
                <CartesianGrid strokeDasharray="3 3" stroke="#252b36" />
                <XAxis dataKey="date" tick={chartStyle} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={chartStyle} />
                <Tooltip
                  contentStyle={{ background: "#151921", border: "1px solid #252b36", borderRadius: 8 }}
                />
                <Legend />
                <Line type="monotone" dataKey="weight_lbs" name="Weight (lbs)" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
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
