"use client";

import { useEffect, useState, useCallback } from "react";
import type { BodyMetric } from "@/lib/types";
import { BodyMetricForm, BodyMetricList } from "@/components/BodyMetricForm";
import { Card } from "@/components/ui";

export default function BodyPage() {
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [editMetric, setEditMetric] = useState<BodyMetric | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/body");
    setMetrics(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const latest = metrics[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Body & InBody</h1>
        <p className="text-sm text-[var(--muted)]">
          Track weight, muscle mass, body fat, and InBody scan readings.
        </p>
      </div>

      {latest && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {latest.weight_lbs != null && (
            <Card className="text-center">
              <p className="text-xs text-[var(--muted)]">Weight</p>
              <p className="text-2xl font-bold">{latest.weight_lbs}</p>
              <p className="text-xs text-[var(--muted)]">lbs</p>
            </Card>
          )}
          {latest.body_fat_pct != null && (
            <Card className="text-center">
              <p className="text-xs text-[var(--muted)]">Body Fat</p>
              <p className="text-2xl font-bold">{latest.body_fat_pct}%</p>
            </Card>
          )}
          {latest.muscle_mass_lbs != null && (
            <Card className="text-center">
              <p className="text-xs text-[var(--muted)]">Muscle Mass</p>
              <p className="text-2xl font-bold">{latest.muscle_mass_lbs}</p>
              <p className="text-xs text-[var(--muted)]">lbs</p>
            </Card>
          )}
          {latest.inbody_score != null && (
            <Card className="text-center">
              <p className="text-xs text-[var(--muted)]">InBody Score</p>
              <p className="text-2xl font-bold text-[var(--accent)]">{latest.inbody_score}</p>
            </Card>
          )}
        </div>
      )}

      <BodyMetricForm
        onSaved={load}
        editMetric={editMetric}
        onCancelEdit={() => setEditMetric(null)}
      />

      <Card title="History">
        <BodyMetricList
          metrics={metrics}
          onEdit={setEditMetric}
          onDelete={async (id) => {
            await fetch(`/api/body/${id}`, { method: "DELETE" });
            load();
          }}
        />
      </Card>
    </div>
  );
}
