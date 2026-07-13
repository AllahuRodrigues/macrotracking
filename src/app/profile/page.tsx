"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Pencil, X, Check, Target, User, Download, Scale, Pill, ClipboardList, BarChart3, Sparkles } from "lucide-react";
import type { UserProfile, BodyMetric } from "@/lib/types";
import { getImageUrl } from "@/lib/storage";
import { Card, Button, Input, Textarea } from "@/components/ui";
import {
  PLAN_TITLE,
  PLAN_START_ISO,
  PLAN_END_ISO,
  PLAN_PHASES,
  PLAN_GOAL_WEIGHT_LBS,
  PLAN_GOAL_BF,
  planPhaseFor,
  planActiveDayCount,
  PLAN_ACTIVE_DAYS_TOTAL,
} from "@/lib/plan";
import { todayISO } from "@/lib/utils";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [latestBody, setLatestBody] = useState<BodyMetric | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<Partial<UserProfile>>({});

  const load = useCallback(async () => {
    const [profileRes, bodyRes] = await Promise.all([
      fetch("/api/profile"),
      fetch("/api/body?limit=1"),
    ]);
    const p = await profileRes.json();
    setProfile(p);
    if (p) setProfileForm(p);
    const b = await bodyRes.json();
    setLatestBody(b[0] ?? null);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveProfile() {
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileForm),
    });
    setEditingProfile(false);
    load();
  }

  const today = todayISO();
  const phase = planPhaseFor(today);
  const activeDay = planActiveDayCount(today);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">You</h1>
        <p className="text-sm text-[var(--muted)]">Profile, targets, and quick links — full InBody lives on Body.</p>
      </div>

      <Card>
        {!editingProfile ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="relative shrink-0">
              {profile?.avatar_filename ? (
                <Image
                  src={getImageUrl(profile.avatar_filename)}
                  alt="Profile"
                  width={112}
                  height={112}
                  className="h-28 w-28 rounded-2xl object-cover ring-2 ring-[var(--accent)]/40"
                  unoptimized
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-[var(--card-border)]">
                  <User size={44} className="text-[var(--muted)]" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">{profile?.name ?? "—"}</h2>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {[
                      profile?.age ? `${profile.age} yrs` : null,
                      profile?.height,
                      profile?.ethnicity,
                      "Male",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <Button variant="ghost" onClick={() => setEditingProfile(true)}>
                  <Pencil size={15} /> Edit
                </Button>
              </div>

              {profile?.goal && (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-[var(--accent)]/10 px-3 py-2.5">
                  <Target size={16} className="mt-0.5 shrink-0 text-[var(--accent)]" />
                  <p className="text-sm font-medium leading-snug text-[var(--accent)]">{profile.goal}</p>
                </div>
              )}

              {profile?.notes && (
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{profile.notes}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Edit Profile</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Input
                label="Name"
                value={profileForm.name ?? ""}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              />
              <Input
                label="Age"
                type="number"
                value={profileForm.age ?? ""}
                onChange={(e) => setProfileForm({ ...profileForm, age: parseInt(e.target.value) })}
              />
              <Input
                label="Height"
                value={profileForm.height ?? ""}
                onChange={(e) => setProfileForm({ ...profileForm, height: e.target.value })}
                placeholder={`5'6" (5'7" shoes)`}
              />
            </div>
            <Input
              label="Goal"
              value={profileForm.goal ?? ""}
              onChange={(e) => setProfileForm({ ...profileForm, goal: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Input
                label="Target Calories"
                type="number"
                value={profileForm.target_calories ?? ""}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, target_calories: parseInt(e.target.value) })
                }
              />
              <Input
                label="Protein (g)"
                type="number"
                value={profileForm.target_protein ?? ""}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, target_protein: parseInt(e.target.value) })
                }
              />
              <Input
                label="Fat (g)"
                type="number"
                value={profileForm.target_fat ?? ""}
                onChange={(e) => setProfileForm({ ...profileForm, target_fat: parseInt(e.target.value) })}
              />
              <Input
                label="Carbs (g)"
                type="number"
                value={profileForm.target_carbs ?? ""}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, target_carbs: parseInt(e.target.value) })
                }
              />
            </div>
            <Textarea
              label="Notes"
              value={profileForm.notes ?? ""}
              onChange={(e) => setProfileForm({ ...profileForm, notes: e.target.value })}
            />
            <div className="flex gap-2">
              <Button onClick={saveProfile}>
                <Check size={15} /> Save
              </Button>
              <Button variant="ghost" onClick={() => setEditingProfile(false)}>
                <X size={15} /> Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* At-a-glance numbers */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Weight"
          value={latestBody?.weight_lbs != null ? `${latestBody.weight_lbs}` : "—"}
          sub="lbs"
        />
        <StatTile
          label="Body fat"
          value={latestBody?.body_fat_pct != null ? `${latestBody.body_fat_pct}%` : "—"}
        />
        <StatTile
          label="Muscle"
          value={latestBody?.muscle_mass_lbs != null ? `${latestBody.muscle_mass_lbs}` : "86.9"}
          sub="lbs SMM"
        />
        <StatTile
          label="Goal"
          value={`${PLAN_GOAL_WEIGHT_LBS}`}
          sub={`lb @ ${PLAN_GOAL_BF}`}
          accent
        />
      </div>

      <Card title="Cut window">
        <p className="mb-3 text-sm font-semibold text-[var(--accent)]">{PLAN_TITLE}</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {PLAN_PHASES.map((p) => (
            <div
              key={p.id}
              className={`rounded-xl border px-3 py-2.5 text-sm ${
                phase?.id === p.id
                  ? "border-[var(--accent)]/40 bg-[var(--accent)]/10"
                  : "border-[var(--card-border)] bg-[var(--background)]"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{p.label}</p>
              <p className="mt-0.5 font-medium">
                {p.start.slice(5)} → {p.end.slice(5)}
              </p>
              {p.rest ? <p className="text-xs text-[var(--muted)]">Steps + sleep only</p> : null}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-[var(--muted)]">
          {phase
            ? phase.rest
              ? "Reset days — recover hard."
              : `Active day ${activeDay} / ${PLAN_ACTIVE_DAYS_TOTAL} · ${PLAN_START_ISO} → ${PLAN_END_ISO}`
            : `Outside the window · plan runs ${PLAN_START_ISO} → ${PLAN_END_ISO}`}
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <QuickLink href="/body" icon={<Scale size={18} />} label="Body / InBody" />
        <QuickLink href="/rituals" icon={<Sparkles size={18} />} label="Rituals" />
        <QuickLink href="/supplements" icon={<Pill size={18} />} label="Supplements" />
        <QuickLink href="/plan" icon={<ClipboardList size={18} />} label="Plan & PPL" />
        <QuickLink href="/stats" icon={<BarChart3 size={18} />} label="Stats" />
      </div>

      <Card title="Export data">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--muted)]">
            Download meals, body, workouts, program, supplements, and photos as one JSON file.
          </p>
          <a
            href="/api/export"
            download
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
          >
            <Download size={15} /> Export all data
          </a>
        </div>
      </Card>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[56px] items-center gap-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-3 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--accent)]/35 hover:bg-[var(--accent)]/5"
    >
      <span className="text-[var(--accent)]">{icon}</span>
      {label}
    </Link>
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
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-3 text-center">
      <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className={`mt-1 text-2xl font-bold leading-none ${accent ? "text-[var(--accent)]" : ""}`}>
        {value}
      </p>
      {sub ? <p className="mt-1 text-xs text-[var(--muted)]">{sub}</p> : null}
    </div>
  );
}
