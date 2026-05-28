"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import type { FoodEntry, MealType } from "@/lib/types";
import { MEAL_TYPES } from "@/lib/utils";
import { Button, Input, Select, Textarea, Card } from "./ui";

interface FoodEntryFormProps {
  date: string;
  onSaved: () => void;
  editEntry?: FoodEntry | null;
  onCancelEdit?: () => void;
}

const emptyForm = {
  meal_type: "breakfast" as MealType,
  name: "",
  calories: "",
  protein: "",
  fat: "",
  carbs: "",
  notes: "",
};

export function FoodEntryForm({ date, onSaved, editEntry, onCancelEdit }: FoodEntryFormProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const isEditing = !!editEntry;

  useEffect(() => {
    if (editEntry) {
      setForm({
        meal_type: editEntry.meal_type,
        name: editEntry.name,
        calories: String(editEntry.calories),
        protein: String(editEntry.protein),
        fat: String(editEntry.fat),
        carbs: String(editEntry.carbs),
        notes: editEntry.notes ?? "",
      });
      setOpen(true);
    }
  }, [editEntry]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      date,
      meal_type: form.meal_type,
      name: form.name,
      calories: parseFloat(form.calories) || 0,
      protein: parseFloat(form.protein) || 0,
      fat: parseFloat(form.fat) || 0,
      carbs: parseFloat(form.carbs) || 0,
      notes: form.notes || undefined,
    };

    try {
      if (isEditing && editEntry) {
        await fetch(`/api/entries/${editEntry.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        onCancelEdit?.();
      } else {
        await fetch("/api/entries", {
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

  function handleCancel() {
    setForm(emptyForm);
    setOpen(false);
    onCancelEdit?.();
  }

  if (!open && !isEditing) {
    return (
      <Button onClick={() => setOpen(true)} className="w-full">
        <Plus size={16} /> Add Food
      </Button>
    );
  }

  return (
    <Card title={isEditing ? "Edit Entry" : "Add Food"}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Meal"
            value={form.meal_type}
            onChange={(e) => setForm({ ...form, meal_type: e.target.value as MealType })}
          >
            {MEAL_TYPES.map((m) => (
              <option key={m} value={m}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </option>
            ))}
          </Select>
          <Input
            label="Date"
            type="date"
            value={date}
            disabled
          />
        </div>

        <Input
          label="Food name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. 3 eggs, 1 tbsp olive oil"
          required
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Input
            label="Calories"
            type="number"
            value={form.calories}
            onChange={(e) => setForm({ ...form, calories: e.target.value })}
            placeholder="0"
          />
          <Input
            label="Protein (g)"
            type="number"
            step="0.1"
            value={form.protein}
            onChange={(e) => setForm({ ...form, protein: e.target.value })}
            placeholder="0"
          />
          <Input
            label="Fat (g)"
            type="number"
            step="0.1"
            value={form.fat}
            onChange={(e) => setForm({ ...form, fat: e.target.value })}
            placeholder="0"
          />
          <Input
            label="Carbs (g)"
            type="number"
            step="0.1"
            value={form.carbs}
            onChange={(e) => setForm({ ...form, carbs: e.target.value })}
            placeholder="0"
          />
        </div>

        <Textarea
          label="Notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Optional notes..."
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={loading || !form.name}>
            <Check size={16} /> {isEditing ? "Update" : "Save"}
          </Button>
          <Button type="button" variant="ghost" onClick={handleCancel}>
            <X size={16} /> Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

interface FoodEntryListProps {
  entries: FoodEntry[];
  onEdit: (entry: FoodEntry) => void;
  onDelete: (id: string) => void;
}

export function FoodEntryList({ entries, onEdit, onDelete }: FoodEntryListProps) {
  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--muted)]">
        No food logged yet. Add your first entry above.
      </p>
    );
  }

  const grouped = MEAL_TYPES.reduce(
    (acc, meal) => {
      acc[meal] = entries.filter((e) => e.meal_type === meal);
      return acc;
    },
    {} as Record<MealType, FoodEntry[]>
  );

  return (
    <div className="space-y-4">
      {MEAL_TYPES.map((meal) => {
        const items = grouped[meal];
        if (items.length === 0) return null;

        const totals = items.reduce(
          (t, e) => ({
            calories: t.calories + e.calories,
            protein: t.protein + e.protein,
            fat: t.fat + e.fat,
            carbs: t.carbs + e.carbs,
          }),
          { calories: 0, protein: 0, fat: 0, carbs: 0 }
        );

        return (
          <div key={meal}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold capitalize">{meal}</h3>
              <span className="text-xs text-[var(--muted)]">
                {Math.round(totals.calories)} kcal · P{Math.round(totals.protein)} F{Math.round(totals.fat)} C{Math.round(totals.carbs)}
              </span>
            </div>
            <div className="space-y-1">
              {items.map((entry) => (
                <div
                  key={entry.id}
                  className="group flex items-center justify-between rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{entry.name}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {Math.round(entry.calories)} kcal · {Math.round(entry.protein)}g P · {Math.round(entry.fat)}g F · {Math.round(entry.carbs)}g C
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => onEdit(entry)}
                      className="rounded p-1.5 text-[var(--muted)] hover:bg-[var(--card-border)] hover:text-[var(--foreground)]"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(entry.id)}
                      className="rounded p-1.5 text-[var(--muted)] hover:bg-red-600/20 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
