"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Camera, Check, X, Loader2 } from "lucide-react";
import { Card, Button } from "@/components/ui";
import type { MealType } from "@/lib/types";

type Item = {
  name: string;
  quantity?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence?: "low" | "medium" | "high";
  include: boolean;
};

type AnalyzeResult = {
  items: Omit<Item, "include">[];
  summary: string;
  totals: { calories: number; protein: number; carbs: number; fat: number };
  cost_usd: number;
};

const MEALS: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

/** Downscale an image file to a compact JPEG data URL to keep AI cost low. */
async function fileToDataUrl(file: File, maxDim = 900): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.7);
}

export function AiFoodScan({ date, onSaved }: { date: string; onSaved: () => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  const [meal, setMeal] = useState<MealType>("lunch");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [budget, setBudget] = useState<{ remaining_usd: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/analyze-food").then((r) => r.json()).then(setBudget).catch(() => {});
  }, []);

  const onFile = async (file?: File) => {
    if (!file) return;
    setError(null);
    setResult(null);
    setItems([]);
    setPreview(URL.createObjectURL(file));
    try {
      setDataUrl(await fileToDataUrl(file));
    } catch {
      setError("Could not read that image.");
    }
  };

  const analyze = async () => {
    if (!dataUrl) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl, hint: hint.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setResult(data);
      setItems(data.items.map((it: Omit<Item, "include">) => ({ ...it, include: true })));
      fetch("/api/analyze-food").then((r) => r.json()).then(setBudget).catch(() => {});
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const included = items.filter((it) => it.include);
  const totals = included.reduce(
    (a, it) => ({
      calories: a.calories + it.calories,
      protein: a.protein + it.protein,
      carbs: a.carbs + it.carbs,
      fat: a.fat + it.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const save = async () => {
    if (!included.length) return;
    setSaving(true);
    try {
      for (const it of included) {
        await fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date,
            meal_type: meal,
            name: it.quantity ? `${it.name} (${it.quantity})` : it.name,
            calories: it.calories,
            protein: it.protein,
            carbs: it.carbs,
            fat: it.fat,
            notes: "Logged via AI photo scan",
          }),
        });
      }
      reset();
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setDataUrl(null);
    setResult(null);
    setItems([]);
    setHint("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <Card className="border-[var(--accent-warm)]/40">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-[var(--accent-warm)]" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground)]">
            AI Food Scan
          </h2>
        </div>
        {budget && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
              budget.remaining_usd > 0
                ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                : "bg-red-500/15 text-red-400"
            }`}
          >
            ${budget.remaining_usd.toFixed(2)} left today
          </span>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />

      {!preview ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--card-border)] py-8 text-[var(--muted)] transition-colors hover:border-[var(--accent-warm)] hover:text-[var(--foreground)]"
        >
          <Camera size={32} />
          <span className="text-sm">Take or upload a photo of your meal</span>
        </button>
      ) : (
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="meal" className="max-h-64 w-full rounded-xl object-cover" />
          <input
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="Optional hints (e.g. '2 wraps, no fries')"
            className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={reset} className="flex-1">
              Change photo
            </Button>
            <Button onClick={analyze} disabled={loading || !dataUrl} className="flex-1">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {loading ? "Analyzing…" : "Analyze"}
            </Button>
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {result && (
        <div className="mt-4 space-y-3">
          {result.summary && <p className="text-sm text-[var(--muted)]">{result.summary}</p>}

          <div className="flex flex-wrap gap-1.5">
            {MEALS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMeal(m)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  meal === m
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {items.map((it, i) => (
              <button
                key={i}
                type="button"
                onClick={() =>
                  setItems((prev) => prev.map((p, idx) => (idx === i ? { ...p, include: !p.include } : p)))
                }
                className={`flex w-full items-center gap-3 rounded-lg border border-[var(--card-border)] p-3 text-left transition-opacity ${
                  it.include ? "opacity-100" : "opacity-40"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    it.include
                      ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                      : "border-[var(--card-border)]"
                  }`}
                >
                  {it.include && <Check size={12} />}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium">
                    {it.name}
                    {it.quantity ? ` · ${it.quantity}` : ""}
                  </span>
                  <span className="block text-xs text-[var(--muted)]">
                    {Math.round(it.calories)} kcal · P{Math.round(it.protein)} · C{Math.round(it.carbs)} · F{Math.round(it.fat)}
                    {it.confidence === "low" ? " · low confidence" : ""}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-lg bg-[var(--accent)]/10 px-3 py-2">
            <span className="text-sm font-semibold">Total to log</span>
            <span className="text-sm font-bold text-[var(--accent)]">
              {Math.round(totals.calories)} kcal · P{Math.round(totals.protein)} · C{Math.round(totals.carbs)} · F{Math.round(totals.fat)}
            </span>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={reset}>
              <X size={16} /> Discard
            </Button>
            <Button onClick={save} disabled={saving || !included.length} className="flex-1">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Log {included.length} item{included.length === 1 ? "" : "s"}
            </Button>
          </div>
          {result.cost_usd > 0 && (
            <p className="text-center text-[10px] text-[var(--muted)]">
              This scan cost ~${result.cost_usd.toFixed(4)}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
