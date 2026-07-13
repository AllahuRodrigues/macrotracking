"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import type { BodyMetric } from "@/lib/types";
import { todayISO } from "@/lib/utils";
import { Button, Input, Textarea, Card } from "./ui";
import { DatePickerField } from "./DatePicker";

interface BodyMetricFormProps {
  onSaved: () => void;
  editMetric?: BodyMetric | null;
  onCancelEdit?: () => void;
}

const emptyForm = {
  date: todayISO(),
  weight_lbs: "",
  body_fat_pct: "",
  muscle_mass_lbs: "",
  skeletal_muscle_lbs: "",
  bmi: "",
  visceral_fat: "",
  inbody_score: "",
  body_water_pct: "",
  bmr: "",
  notes: "",
};

export function BodyMetricForm({ onSaved, editMetric, onCancelEdit }: BodyMetricFormProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const isEditing = !!editMetric;

  useEffect(() => {
    if (editMetric) {
      setForm({
        date: editMetric.date,
        weight_lbs: editMetric.weight_lbs != null ? String(editMetric.weight_lbs) : "",
        body_fat_pct: editMetric.body_fat_pct != null ? String(editMetric.body_fat_pct) : "",
        muscle_mass_lbs: editMetric.muscle_mass_lbs != null ? String(editMetric.muscle_mass_lbs) : "",
        skeletal_muscle_lbs: editMetric.skeletal_muscle_lbs != null ? String(editMetric.skeletal_muscle_lbs) : "",
        bmi: editMetric.bmi != null ? String(editMetric.bmi) : "",
        visceral_fat: editMetric.visceral_fat != null ? String(editMetric.visceral_fat) : "",
        inbody_score: editMetric.inbody_score != null ? String(editMetric.inbody_score) : "",
        body_water_pct: editMetric.body_water_pct != null ? String(editMetric.body_water_pct) : "",
        bmr: editMetric.bmr != null ? String(editMetric.bmr) : "",
        notes: editMetric.notes ?? "",
      });
      setOpen(true);
    }
  }, [editMetric]);

  function num(val: string) {
    const n = parseFloat(val);
    return val === "" ? undefined : n;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      date: form.date,
      weight_lbs: num(form.weight_lbs),
      body_fat_pct: num(form.body_fat_pct),
      muscle_mass_lbs: num(form.muscle_mass_lbs),
      skeletal_muscle_lbs: num(form.skeletal_muscle_lbs),
      bmi: num(form.bmi),
      visceral_fat: num(form.visceral_fat),
      inbody_score: num(form.inbody_score),
      body_water_pct: num(form.body_water_pct),
      bmr: num(form.bmr),
      notes: form.notes || undefined,
    };

    try {
      if (isEditing && editMetric) {
        await fetch(`/api/body/${editMetric.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        onCancelEdit?.();
      } else {
        await fetch("/api/body", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setForm(emptyForm);
      setOpen(false);
      onSaved();
    } finally {
      setLoading(false);
    }
  }

  if (!open && !isEditing) {
    return (
      <Button onClick={() => setOpen(true)} className="w-full">
        <Plus size={16} /> Log Body / InBody
      </Button>
    );
  }

  return (
    <Card title={isEditing ? "Edit Reading" : "New Body / InBody Reading"}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <DatePickerField
          label="Date"
          value={form.date}
          onChange={(date) => setForm({ ...form, date })}
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Input label="Weight (lbs)" type="number" step="0.1" value={form.weight_lbs} onChange={(e) => setForm({ ...form, weight_lbs: e.target.value })} />
          <Input label="Body Fat %" type="number" step="0.1" value={form.body_fat_pct} onChange={(e) => setForm({ ...form, body_fat_pct: e.target.value })} />
          <Input label="Muscle Mass (lbs)" type="number" step="0.1" value={form.muscle_mass_lbs} onChange={(e) => setForm({ ...form, muscle_mass_lbs: e.target.value })} />
          <Input label="Skeletal Muscle (lbs)" type="number" step="0.1" value={form.skeletal_muscle_lbs} onChange={(e) => setForm({ ...form, skeletal_muscle_lbs: e.target.value })} />
          <Input label="BMI" type="number" step="0.1" value={form.bmi} onChange={(e) => setForm({ ...form, bmi: e.target.value })} />
          <Input label="Visceral Fat" type="number" step="0.1" value={form.visceral_fat} onChange={(e) => setForm({ ...form, visceral_fat: e.target.value })} />
          <Input label="InBody Score" type="number" step="1" value={form.inbody_score} onChange={(e) => setForm({ ...form, inbody_score: e.target.value })} />
          <Input label="Body Water %" type="number" step="0.1" value={form.body_water_pct} onChange={(e) => setForm({ ...form, body_water_pct: e.target.value })} />
          <Input label="BMR (kcal)" type="number" step="1" value={form.bmr} onChange={(e) => setForm({ ...form, bmr: e.target.value })} />
        </div>

        <Textarea label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            <Check size={16} /> {isEditing ? "Update" : "Save"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => { setOpen(false); setForm(emptyForm); onCancelEdit?.(); }}>
            <X size={16} /> Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

interface BodyMetricListProps {
  metrics: BodyMetric[];
  onEdit?: (m: BodyMetric) => void;
  onDelete?: (id: string) => void;
}

export function BodyMetricList({ metrics, onEdit, onDelete }: BodyMetricListProps) {
  if (metrics.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--muted)]">
        No body readings yet. Log your first InBody or weigh-in.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {metrics.map((m) => (
        <div
          key={m.id}
          className="group rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-3"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold">{m.date}</span>
            {(onEdit || onDelete) && (
              <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                {onEdit && (
                  <button onClick={() => onEdit(m)} className="rounded p-1.5 text-[var(--muted)] hover:bg-[var(--card-border)]">
                    <Pencil size={14} />
                  </button>
                )}
                {onDelete && (
                  <button onClick={() => onDelete(m.id)} className="rounded p-1.5 text-[var(--muted)] hover:bg-red-600/20 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs sm:grid-cols-5">
            {m.weight_lbs != null && <MetricCell label="Weight" value={`${m.weight_lbs} lbs`} />}
            {m.body_fat_pct != null && <MetricCell label="Body Fat" value={`${m.body_fat_pct}%`} />}
            {m.muscle_mass_lbs != null && <MetricCell label="Muscle" value={`${m.muscle_mass_lbs} lbs`} />}
            {m.skeletal_muscle_lbs != null && <MetricCell label="Sk. Muscle" value={`${m.skeletal_muscle_lbs} lbs`} />}
            {m.bmi != null && <MetricCell label="BMI" value={String(m.bmi)} />}
            {m.visceral_fat != null && <MetricCell label="Visceral" value={String(m.visceral_fat)} />}
            {m.inbody_score != null && <MetricCell label="InBody" value={String(m.inbody_score)} />}
            {m.body_water_pct != null && <MetricCell label="Water" value={`${m.body_water_pct}%`} />}
            {m.bmr != null && <MetricCell label="BMR" value={`${m.bmr} kcal`} />}
          </div>
          {m.notes && <p className="mt-2 text-xs text-[var(--muted)]">{m.notes}</p>}
        </div>
      ))}
    </div>
  );
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[var(--muted)]">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
