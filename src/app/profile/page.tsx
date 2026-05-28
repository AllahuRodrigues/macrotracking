"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  Pencil, Trash2, Plus, X, Check, Pill, Target, Activity,
  Dumbbell, Droplets, Flame, Scale, User, Zap, Coffee, TrendingDown,
} from "lucide-react";
import type { Supplement, SupplementCategory, UserProfile } from "@/lib/types";
import { getImageUrl } from "@/lib/storage";
import type { BodyMetric } from "@/lib/types";
import { Card, Button, Input, Select, Textarea } from "@/components/ui";
import { SupplementDailyTracker } from "@/components/SupplementDailyTracker";
import { InBodyReportCard } from "@/components/InBodyReportCard";
import { INBODY_REPORT, INBODY_SCAN_DATE } from "@/lib/inbody-report";

const SUPP_CATEGORIES: { value: SupplementCategory; label: string }[] = [
  { value: "vitamin", label: "Vitamin" },
  { value: "mineral", label: "Mineral" },
  { value: "amino_acid", label: "Amino Acid" },
  { value: "performance", label: "Performance" },
  { value: "omega", label: "Omega / Fat" },
  { value: "protein", label: "Protein / Food" },
  { value: "herb", label: "Herb / Plant" },
  { value: "other", label: "Other" },
];

const CATEGORY_COLORS: Record<SupplementCategory, string> = {
  vitamin: "#f59e0b",
  mineral: "#3b82f6",
  amino_acid: "#8b5cf6",
  performance: "#22c55e",
  omega: "#f97316",
  protein: "#06b6d4",
  herb: "#84cc16",
  other: "#6b7280",
};

const CATEGORY_ICONS: Record<SupplementCategory, React.ReactNode> = {
  vitamin: <Pill size={12} />,
  mineral: <Droplets size={12} />,
  amino_acid: <Activity size={12} />,
  performance: <Dumbbell size={12} />,
  omega: <Flame size={12} />,
  protein: <Scale size={12} />,
  herb: <Pill size={12} />,
  other: <Pill size={12} />,
};

const emptySuppForm = {
  name: "",
  brand: "",
  dose: "",
  category: "other" as SupplementCategory,
  timing: "",
  notes: "",
  active: 1,
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [latestBody, setLatestBody] = useState<BodyMetric | null>(null);

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<Partial<UserProfile>>({});

  const [suppForm, setSuppForm] = useState(emptySuppForm);
  const [editingSupp, setEditingSupp] = useState<Supplement | null>(null);
  const [addingSupp, setAddingSupp] = useState(false);

  const load = useCallback(async () => {
    const [profileRes, suppRes, bodyRes] = await Promise.all([
      fetch("/api/profile"),
      fetch("/api/supplements"),
      fetch("/api/body?limit=1"),
    ]);
    const p = await profileRes.json();
    setProfile(p);
    if (p) setProfileForm(p);
    setSupplements(await suppRes.json());
    const b = await bodyRes.json();
    setLatestBody(b[0] ?? null);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveProfile() {
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileForm),
    });
    setEditingProfile(false);
    load();
  }

  async function saveSupp() {
    if (editingSupp) {
      await fetch(`/api/supplements/${editingSupp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(suppForm),
      });
    } else {
      await fetch("/api/supplements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(suppForm),
      });
    }
    setSuppForm(emptySuppForm);
    setEditingSupp(null);
    setAddingSupp(false);
    load();
  }

  function startEditSupp(s: Supplement) {
    setSuppForm({
      name: s.name,
      brand: s.brand ?? "",
      dose: s.dose ?? "",
      category: s.category,
      timing: s.timing ?? "",
      notes: s.notes ?? "",
      active: s.active,
    });
    setEditingSupp(s);
    setAddingSupp(true);
  }

  async function deleteSupp(id: string) {
    await fetch(`/api/supplements/${id}`, { method: "DELETE" });
    load();
  }

  async function toggleSupp(s: Supplement) {
    await fetch(`/api/supplements/${s.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: s.active ? 0 : 1 }),
    });
    load();
  }

  const grouped = SUPP_CATEGORIES.reduce((acc, { value }) => {
    acc[value] = supplements.filter((s) => s.category === value);
    return acc;
  }, {} as Record<SupplementCategory, Supplement[]>);

  const activeCount = supplements.filter((s) => s.active).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Profile</h1>

      {/* ── Profile Card ── */}
      <Card>
        {!editingProfile ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="relative shrink-0">
              {profile?.avatar_filename ? (
                <Image
                  src={getImageUrl(profile.avatar_filename)}
                  alt="Profile"
                  width={100}
                  height={100}
                  className="h-24 w-24 rounded-2xl object-cover ring-2 ring-[var(--accent)]/40"
                  unoptimized
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-[var(--card-border)]">
                  <User size={40} className="text-[var(--muted)]" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold">{profile?.name ?? "—"}</h2>
                  <p className="text-sm text-[var(--muted)]">
                    {profile?.age ? `${profile.age} yrs` : ""}
                    {profile?.height ? ` · ${profile.height}` : ""}
                    {profile?.ethnicity ? ` · ${profile.ethnicity}` : ""}
                    {" · Male"}
                  </p>
                </div>
                <Button variant="ghost" onClick={() => setEditingProfile(true)}>
                  <Pencil size={15} /> Edit
                </Button>
              </div>
              {profile?.goal && (
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-[var(--accent)]/10 px-3 py-2">
                  <Target size={14} className="text-[var(--accent)] shrink-0" />
                  <p className="text-sm text-[var(--accent)] font-medium">{profile.goal}</p>
                </div>
              )}
              {profile?.notes && (
                <p className="mt-2 text-xs text-[var(--muted)]">{profile.notes}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide">Edit Profile</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Input label="Name" value={profileForm.name ?? ""} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
              <Input label="Age" type="number" value={profileForm.age ?? ""} onChange={(e) => setProfileForm({ ...profileForm, age: parseInt(e.target.value) })} />
              <Input label="Height" value={profileForm.height ?? ""} onChange={(e) => setProfileForm({ ...profileForm, height: e.target.value })} placeholder="5′6.5″" />
            </div>
            <Input label="Goal" value={profileForm.goal ?? ""} onChange={(e) => setProfileForm({ ...profileForm, goal: e.target.value })} placeholder="Cut / Bulk / Recomp…" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Input label="Target Calories" type="number" value={profileForm.target_calories ?? ""} onChange={(e) => setProfileForm({ ...profileForm, target_calories: parseInt(e.target.value) })} />
              <Input label="Protein (g)" type="number" value={profileForm.target_protein ?? ""} onChange={(e) => setProfileForm({ ...profileForm, target_protein: parseInt(e.target.value) })} />
              <Input label="Fat (g)" type="number" value={profileForm.target_fat ?? ""} onChange={(e) => setProfileForm({ ...profileForm, target_fat: parseInt(e.target.value) })} />
              <Input label="Carbs (g)" type="number" value={profileForm.target_carbs ?? ""} onChange={(e) => setProfileForm({ ...profileForm, target_carbs: parseInt(e.target.value) })} />
            </div>
            <Textarea label="Notes" value={profileForm.notes ?? ""} onChange={(e) => setProfileForm({ ...profileForm, notes: e.target.value })} />
            <div className="flex gap-2">
              <Button onClick={saveProfile}><Check size={15} /> Save</Button>
              <Button variant="ghost" onClick={() => setEditingProfile(false)}><X size={15} /> Cancel</Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Full InBody Report ── */}
      <InBodyReportCard />

      {/* Latest weigh-in if newer than scan */}
      {latestBody && latestBody.date !== INBODY_SCAN_DATE && (
        <Card title={`Latest Weigh-In — ${latestBody.date}`}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Weight" value={latestBody.weight_lbs != null ? `${latestBody.weight_lbs} lb` : "—"} />
            <StatTile label="Body Fat" value={latestBody.body_fat_pct != null ? `${latestBody.body_fat_pct}%` : "—"} />
            {latestBody.notes && (
              <p className="col-span-full text-xs text-[var(--muted)]">{latestBody.notes}</p>
            )}
          </div>
        </Card>
      )}

      {/* ── Daily Intake Tracker ── */}
      <SupplementDailyTracker compact />

      {/* ── Supplement Timing Schedule ── */}
      <Card title="Daily Supplement Schedule">
        <div className="space-y-3">
          {[
            {
              time: "🌅 Morning (7–9 AM)",
              label: "With breakfast",
              color: "border-amber-400/30 bg-amber-400/5",
              items: [
                { name: "Vitamin D3", dose: "5,000 IU", note: "take with fattest meal — fat-soluble" },
                { name: "Vitamin K2", dose: "100 mcg", note: "always paired with D3" },
                { name: "Zinc", dose: "50 mg", note: "every 2 days with breakfast — not daily" },
                { name: "Omega-3 Fish Oil", dose: "1,000 mg", note: "with your fattiest meal" },
                { name: "Magnesium + B6", dose: "Per label", note: "or move to evening if you prefer" },
              ],
            },
            {
              time: "💪 Pre-Workout (30–45 min before)",
              label: "Before training",
              color: "border-[var(--accent)]/30 bg-[var(--accent)]/5",
              items: [
                { name: "L-Citrulline", dose: "3,000 mg", note: "pump, blood flow, endurance — take on empty-ish stomach" },
              ],
            },
            {
              time: "🥤 Post-Workout (within 1–2 hrs)",
              label: "After training",
              color: "border-blue-400/30 bg-blue-400/5",
              items: [
                { name: "Creatine Monohydrate", dose: "5 g", note: "timing doesn't matter much — just be consistent daily" },
                { name: "Gold Standard Whey", dose: "1–2 scoops", note: "hit your 200g protein target — mix in water or milk" },
              ],
            },
            {
              time: "🌙 Before Bed (30–60 min before sleep)",
              label: "Night recovery",
              color: "border-purple-400/30 bg-purple-400/5",
              items: [
                { name: "Magnesium Glycinate", dose: "240 mg", note: "best form for sleep & muscle recovery — take alone" },
              ],
            },
          ].map((block) => (
            <div key={block.time} className={`rounded-xl border p-3 ${block.color}`}>
              <p className="text-sm font-semibold mb-2">{block.time}</p>
              <div className="space-y-1.5">
                {block.items.map((item) => (
                  <div key={item.name} className="flex items-start justify-between gap-2 text-xs">
                    <span className="font-medium">{item.name} <span className="text-[var(--muted)] font-normal">— {item.dose}</span></span>
                    <span className="text-[var(--muted)] text-right shrink-0 max-w-[40%]">{item.note}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-[var(--muted)] pt-1">Quest bar anytime as a snack to hit protein. Water goal: 4L / day.</p>
        </div>
      </Card>

      {/* ── Cut Plan ── */}
      <Card title="Cut Plan — 8–10 Weeks">
        <div className="mb-4 rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={16} className="text-[var(--accent)]" />
            <p className="font-semibold text-[var(--accent)]">
              {INBODY_REPORT.control.startWeightLb} lb → {INBODY_REPORT.control.targetWeightLb} lb @ {INBODY_REPORT.control.targetBodyFatPct} BF
            </p>
          </div>
          <p className="text-xs text-[var(--muted)]">
            Lose {INBODY_REPORT.control.suggestedFatLossLb} lb fat · keep muscle · ~1.5 lb/week · Maintenance {INBODY_REPORT.comprehensive.maintenanceEstimate}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-4">
          <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/8 p-3">
            <div className="flex items-center gap-1.5 mb-2 text-[var(--accent)] font-semibold text-xs uppercase tracking-wide">
              <Dumbbell size={13} /> Workout Day
            </div>
            <MacroRow label="Calories" value="2,300 kcal" highlight />
            <MacroRow label="Protein" value="200 g" />
            <MacroRow label="Carbs" value="220 g" />
            <MacroRow label="Fat" value="55–60 g" />
          </div>

          <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-3">
            <div className="flex items-center gap-1.5 mb-2 text-blue-400 font-semibold text-xs uppercase tracking-wide">
              <Zap size={13} /> Base / Any Day
            </div>
            <MacroRow label="Calories" value="2,250 kcal" highlight />
            <MacroRow label="Protein" value="200 g" />
            <MacroRow label="Carbs" value="200 g" />
            <MacroRow label="Fat" value="61 g" />
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
            <div className="flex items-center gap-1.5 mb-2 text-amber-400 font-semibold text-xs uppercase tracking-wide">
              <Coffee size={13} /> Rest Day
            </div>
            <MacroRow label="Calories" value="2,100–2,200 kcal" highlight />
            <MacroRow label="Protein" value="200 g" />
            <MacroRow label="Carbs" value="150–180 g" />
            <MacroRow label="Fat" value="65–75 g" />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-1">Daily Non-Negotiables</p>
          {[
            { icon: "🏋️", rule: "Lift heavy 4–6×/week" },
            { icon: "🥩", rule: "200g protein every single day" },
            { icon: "😴", rule: "7–9 hours sleep" },
            { icon: "🍚", rule: "Carbs around workouts — before & after" },
            { icon: "⚠️", rule: "Never drop below 2,000 calories (kills muscle, T, and recovery)" },
          ].map(({ icon, rule }) => (
            <div key={rule} className="flex items-start gap-2 text-sm">
              <span className="text-base leading-tight shrink-0">{icon}</span>
              <span className="text-[var(--muted)]">{rule}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs">
          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-2">
            <p className="text-[var(--muted)]">Start (InBody)</p>
            <p className="font-bold text-base">{INBODY_REPORT.control.startWeightLb} lb</p>
            <p className="text-[var(--muted)]">{INBODY_REPORT.obesityAnalysis.percentBodyFat}% BF</p>
          </div>
          <div className="rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-2">
            <p className="text-[var(--muted)]">Timeline</p>
            <p className="font-bold text-base text-[var(--accent)]">8–10 wks</p>
            <p className="text-[var(--muted)]">−{INBODY_REPORT.control.suggestedFatLossLb} lb fat</p>
          </div>
          <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-2">
            <p className="text-[var(--muted)]">Target</p>
            <p className="font-bold text-base">{INBODY_REPORT.control.targetWeightLb} lb</p>
            <p className="text-[var(--muted)]">{INBODY_REPORT.control.targetBodyFatPct} BF</p>
          </div>
        </div>
      </Card>

      {/* ── Supplement Stack ── */}
      <Card
        title={`Supplement Stack (${activeCount} active)`}
        action={
          <Button onClick={() => { setSuppForm(emptySuppForm); setEditingSupp(null); setAddingSupp(true); }}>
            <Plus size={14} /> Add
          </Button>
        }
      >
        {addingSupp && (
          <div className="mb-4 rounded-xl border border-[var(--card-border)] bg-[var(--background)] p-4 space-y-3">
            <p className="text-xs font-semibold uppercase text-[var(--muted)]">
              {editingSupp ? "Edit Supplement" : "New Supplement"}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Input label="Name" value={suppForm.name} onChange={(e) => setSuppForm({ ...suppForm, name: e.target.value })} required />
              <Input label="Brand" value={suppForm.brand} onChange={(e) => setSuppForm({ ...suppForm, brand: e.target.value })} />
              <Input label="Dose" value={suppForm.dose} onChange={(e) => setSuppForm({ ...suppForm, dose: e.target.value })} placeholder="e.g. 5 g" />
              <Select label="Category" value={suppForm.category} onChange={(e) => setSuppForm({ ...suppForm, category: e.target.value as SupplementCategory })}>
                {SUPP_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
              <Input label="Timing" value={suppForm.timing} onChange={(e) => setSuppForm({ ...suppForm, timing: e.target.value })} placeholder="Pre-workout, before bed…" />
            </div>
            <Textarea label="Notes" value={suppForm.notes} onChange={(e) => setSuppForm({ ...suppForm, notes: e.target.value })} />
            <div className="flex gap-2">
              <Button onClick={saveSupp} disabled={!suppForm.name}><Check size={15} /> Save</Button>
              <Button variant="ghost" onClick={() => { setAddingSupp(false); setEditingSupp(null); }}><X size={15} /> Cancel</Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {SUPP_CATEGORIES.map(({ value, label }) => {
            const items = grouped[value];
            if (!items?.length) return null;
            return (
              <div key={value}>
                <div className="mb-2 flex items-center gap-2">
                  <span style={{ color: CATEGORY_COLORS[value] }} className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide">
                    {CATEGORY_ICONS[value]} {label}
                  </span>
                  <div className="h-px flex-1 bg-[var(--card-border)]" />
                </div>
                <div className="space-y-1.5">
                  {items.map((s) => (
                    <div
                      key={s.id}
                      className={`group flex items-start justify-between rounded-lg border px-3 py-2.5 transition-opacity ${
                        s.active ? "border-[var(--card-border)] bg-[var(--background)]" : "border-[var(--card-border)]/50 bg-[var(--background)]/50 opacity-50"
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <button
                          onClick={() => toggleSupp(s)}
                          className={`mt-0.5 h-4 w-4 shrink-0 rounded border-2 transition-colors ${
                            s.active
                              ? "border-[var(--accent)] bg-[var(--accent)]"
                              : "border-[var(--card-border)] bg-transparent"
                          }`}
                        >
                          {s.active ? <Check size={10} className="text-black" /> : null}
                        </button>
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-tight">
                            {s.name}
                            {s.dose && <span className="ml-1.5 text-xs font-normal text-[var(--muted)]">{s.dose}</span>}
                          </p>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[var(--muted)]">
                            {s.brand && <span>{s.brand}</span>}
                            {s.timing && <span>· {s.timing}</span>}
                          </div>
                          {s.notes && <p className="text-xs text-[var(--muted)] mt-0.5 truncate">{s.notes}</p>}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                        <button onClick={() => startEditSupp(s)} className="rounded p-1.5 text-[var(--muted)] hover:bg-[var(--card-border)]"><Pencil size={13} /></button>
                        <button onClick={() => deleteSupp(s.id)} className="rounded p-1.5 text-[var(--muted)] hover:bg-red-600/20 hover:text-red-400"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function MacroRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between py-0.5 text-xs">
      <span className="text-[var(--muted)]">{label}</span>
      <span className={highlight ? "font-bold" : "font-medium"}>{value}</span>
    </div>
  );
}

function StatTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-2.5 text-center">
      <p className="text-[10px] text-[var(--muted)]">{label}</p>
      <p className={`text-base font-bold leading-tight ${accent ? "text-[var(--accent)]" : ""}`}>{value}</p>
      {sub && <p className="text-[10px] text-[var(--muted)]">{sub}</p>}
    </div>
  );
}
