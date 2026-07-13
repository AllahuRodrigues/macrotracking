"use client";

import { useRef, useState } from "react";
import { Camera, Scale, Activity, Upload, Loader2 } from "lucide-react";
import { Card, Button, Input, Select, Textarea } from "@/components/ui";
import { DatePickerField } from "@/components/DatePicker";
import { todayISO } from "@/lib/utils";

type Mode = "weigh" | "inbody" | "photo" | null;

/** Dashboard quick-add: weigh-in, full InBody, or progress photo. */
export function QuickLogPanel({ onSaved }: { onSaved: () => void }) {
  const [mode, setMode] = useState<Mode>(null);

  return (
    <Card title="Quick log" className="border-[var(--accent)]/25">
      <div className="mb-3 grid grid-cols-3 gap-2">
        <ModeBtn
          active={mode === "weigh"}
          onClick={() => setMode(mode === "weigh" ? null : "weigh")}
          icon={<Scale size={16} />}
          label="Weigh-in"
        />
        <ModeBtn
          active={mode === "inbody"}
          onClick={() => setMode(mode === "inbody" ? null : "inbody")}
          icon={<Activity size={16} />}
          label="InBody"
        />
        <ModeBtn
          active={mode === "photo"}
          onClick={() => setMode(mode === "photo" ? null : "photo")}
          icon={<Camera size={16} />}
          label="Photo"
        />
      </div>

      {mode === "weigh" && (
        <WeighForm
          onDone={() => {
            setMode(null);
            onSaved();
          }}
        />
      )}
      {mode === "inbody" && (
        <InBodyForm
          onDone={() => {
            setMode(null);
            onSaved();
          }}
        />
      )}
      {mode === "photo" && (
        <PhotoForm
          onDone={() => {
            setMode(null);
            onSaved();
          }}
        />
      )}

      {!mode && (
        <p className="text-xs text-[var(--muted)]">
          One-tap logging — morning scale, InBody printout numbers, or progress photo.
        </p>
      )}
    </Card>
  );
}

function ModeBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs font-semibold transition-colors ${
        active
          ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
          : "border-[var(--card-border)] bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function WeighForm({ onDone }: { onDone: () => void }) {
  const [date, setDate] = useState(todayISO());
  const [weight, setWeight] = useState("");
  const [bf, setBf] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!weight) return;
    setLoading(true);
    try {
      await fetch("/api/body", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          weight_lbs: parseFloat(weight),
          body_fat_pct: bf ? parseFloat(bf) : undefined,
          notes: "Morning weigh-in",
        }),
      });
      onDone();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <DatePickerField label="Date" value={date} onChange={setDate} />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Weight (lb)"
          type="number"
          step="0.1"
          required
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
        <Input
          label="BF % (optional)"
          type="number"
          step="0.1"
          value={bf}
          onChange={(e) => setBf(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
        Save weigh-in
      </Button>
    </form>
  );
}

function InBodyForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({
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
  });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const num = (s: string) => (s === "" ? undefined : parseFloat(s));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.weight_lbs) return;
    setLoading(true);
    try {
      await fetch("/api/body", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
          notes: form.notes || `InBody scan — ${form.date}`,
        }),
      });
      onDone();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-xs text-[var(--muted)]">
        Enter key numbers from your InBody 580 sheet. Blanks are fine.
      </p>
      <DatePickerField label="Scan date" value={form.date} onChange={(d) => set("date", d)} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Input label="Weight lb *" type="number" step="0.1" required value={form.weight_lbs} onChange={(e) => set("weight_lbs", e.target.value)} />
        <Input label="InBody BF %" type="number" step="0.1" value={form.body_fat_pct} onChange={(e) => set("body_fat_pct", e.target.value)} />
        <Input label="Score" type="number" value={form.inbody_score} onChange={(e) => set("inbody_score", e.target.value)} />
        <Input label="SMM lb" type="number" step="0.1" value={form.skeletal_muscle_lbs} onChange={(e) => set("skeletal_muscle_lbs", e.target.value)} />
        <Input label="Muscle lb" type="number" step="0.1" value={form.muscle_mass_lbs} onChange={(e) => set("muscle_mass_lbs", e.target.value)} />
        <Input label="BMI" type="number" step="0.1" value={form.bmi} onChange={(e) => set("bmi", e.target.value)} />
        <Input label="Visceral cm²" type="number" step="0.1" value={form.visceral_fat} onChange={(e) => set("visceral_fat", e.target.value)} />
        <Input label="Water %" type="number" step="0.1" value={form.body_water_pct} onChange={(e) => set("body_water_pct", e.target.value)} />
        <Input label="BMR" type="number" value={form.bmr} onChange={(e) => set("bmr", e.target.value)} />
      </div>
      <Textarea label="Notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Phase angle, FFMI…" />
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}
        Save InBody reading
      </Button>
    </form>
  );
}

function PhotoForm({ onDone }: { onDone: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [date, setDate] = useState(todayISO());
  const [category, setCategory] = useState("body");
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Choose a photo first");
      return;
    }
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("date", date);
    fd.append("category", category);
    if (caption) fd.append("caption", caption);
    try {
      const res = await fetch("/api/photos", { method: "POST", body: fd });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Upload failed");
      }
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <DatePickerField label="Date" value={date} onChange={setDate} />
        <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="body">Body</option>
          <option value="progress">Progress</option>
          <option value="meal">Meal</option>
        </Select>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="block w-full text-sm text-[var(--muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--accent)]/15 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[var(--accent)]"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setPreview(URL.createObjectURL(f));
        }}
      />
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="preview" className="max-h-48 w-full rounded-xl object-cover" />
      )}
      <Input label="Caption" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Front / side / back…" />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        Upload photo
      </Button>
    </form>
  );
}
