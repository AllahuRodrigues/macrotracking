"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Calendar, ChevronLeft, ChevronRight, Scale, Target, TrendingDown } from "lucide-react";
import type { BodyMetric, PhotoEntry } from "@/lib/types";
import { getImageUrl } from "@/lib/storage";
import {
  JOURNEY_END_ISO,
  JOURNEY_GOAL_WEIGHT_LBS,
  JOURNEY_START_ISO,
  JOURNEY_START_WEIGHT_LBS,
  daysUntilJourneyEnd,
  formatJourneyDate,
  inferPoseFromCaption,
  journeyProgressPct,
  type BodyPose,
} from "@/lib/body-journey";
import { todayISO } from "@/lib/utils";
import { Card } from "./ui";

interface BodyProgressTrackerProps {
  photos: PhotoEntry[];
  bodyMetrics: BodyMetric[];
}

function PhotoTile({
  photo,
  large,
  onClick,
}: {
  photo: PhotoEntry;
  large?: boolean;
  onClick?: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const src = getImageUrl(photo.filename);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-left transition-all hover:border-[var(--accent)] hover:shadow-md ${
        large ? "col-span-2 row-span-2" : ""
      }`}
    >
      <div className={`relative ${large ? "aspect-[3/4]" : "aspect-[3/4]"}`}>
        {!failed && src ? (
          <Image
            src={src}
            alt={photo.caption ?? "Progress"}
            fill
            className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
            sizes={large ? "50vw" : "25vw"}
            unoptimized
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-[var(--muted)]">
            Unable to load
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-2 pb-2 pt-10">
          <p className="text-[11px] font-medium text-white">{photo.caption ?? "Progress"}</p>
        </div>
      </div>
    </button>
  );
}

export function BodyProgressTracker({ photos, bodyMetrics }: BodyProgressTrackerProps) {
  const today = todayISO();
  const daysLeft = daysUntilJourneyEnd(today);
  const progressPct = journeyProgressPct(today);

  const bodyPhotos = useMemo(
    () =>
      photos
        .filter((p) => p.category === "body" || p.category === "progress")
        .sort((a, b) => b.date.localeCompare(a.date) || (a.caption ?? "").localeCompare(b.caption ?? "")),
    [photos]
  );

  const sessions = useMemo(() => {
    const byDate = new Map<string, PhotoEntry[]>();
    for (const p of bodyPhotos) {
      const list = byDate.get(p.date) ?? [];
      list.push(p);
      byDate.set(p.date, list);
    }
    return [...byDate.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, items]) => ({
        date,
        photos: items.sort((a, b) => {
          const order: Record<BodyPose, number> = { front: 0, side: 1, back: 2, other: 3 };
          return order[inferPoseFromCaption(a.caption)] - order[inferPoseFromCaption(b.caption)];
        }),
        weight: bodyMetrics.find((m) => m.date === date)?.weight_lbs,
      }));
  }, [bodyPhotos, bodyMetrics]);

  const latestWeight =
    bodyMetrics.find((m) => m.date === today)?.weight_lbs ??
    bodyMetrics[0]?.weight_lbs ??
    JOURNEY_START_WEIGHT_LBS;

  const weightToGoal = Math.max(0, latestWeight - JOURNEY_GOAL_WEIGHT_LBS);

  const [activeSession, setActiveSession] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const session = sessions[activeSession];
  const checkInCount = sessions.length;

  if (bodyPhotos.length === 0) {
    return (
      <Card>
        <p className="py-10 text-center text-sm text-[var(--muted)]">
          No body progress photos yet. Upload your first check-in below.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Journey header */}
      <div className="overflow-hidden rounded-2xl border border-[var(--card-border)] bg-gradient-to-br from-[var(--card)] to-[var(--background)]">
        <div className="border-b border-[var(--card-border)] px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--accent)]">
                Body recomp · Photo journey
              </p>
              <h2 className="text-lg font-bold tracking-tight sm:text-xl">
                {formatJourneyDate(JOURNEY_START_ISO)} → {formatJourneyDate(JOURNEY_END_ISO)}
              </h2>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                {checkInCount} check-in{checkInCount !== 1 ? "s" : ""} logged · Pacific (SF) dates
              </p>
            </div>
            <div className="flex gap-2">
              <StatPill icon={<Calendar size={14} />} label="Days left" value={String(daysLeft)} />
              <StatPill icon={<Scale size={14} />} label="Today" value={`${latestWeight} lb`} sub="~85 kg" />
            </div>
          </div>
        </div>

        <div className="px-4 py-4 sm:px-5">
          <div className="mb-2 flex justify-between text-xs">
            <span className="text-[var(--muted)]">Journey progress</span>
            <span className="font-semibold text-[var(--accent)]">{progressPct}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-[var(--card-border)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#748873] to-[#D1A980] transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-[var(--background)] px-2 py-2">
              <p className="text-[var(--muted)]">Start</p>
              <p className="font-bold">{JOURNEY_START_WEIGHT_LBS} lb</p>
            </div>
            <div className="rounded-lg bg-[var(--accent)]/10 px-2 py-2">
              <p className="text-[var(--muted)]">Current</p>
              <p className="font-bold text-[var(--accent)]">{latestWeight} lb</p>
            </div>
            <div className="rounded-lg bg-[var(--background)] px-2 py-2">
              <p className="text-[var(--muted)]">Goal</p>
              <p className="font-bold">{JOURNEY_GOAL_WEIGHT_LBS} lb</p>
            </div>
          </div>
          {weightToGoal > 0 && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-[var(--muted)]">
              <TrendingDown size={13} className="text-[var(--accent)]" />
              ~{weightToGoal.toFixed(0)} lb to goal by Aug 14 · stay consistent with photos + macros
            </p>
          )}
        </div>
      </div>

      {/* Session navigator */}
      {session && (
        <Card
          title={`Check-in — ${formatJourneyDate(session.date)}`}
          action={
            sessions.length > 1 ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={activeSession >= sessions.length - 1}
                  onClick={() => setActiveSession((i) => Math.min(sessions.length - 1, i + 1))}
                  className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--card-border)] disabled:opacity-30"
                  aria-label="Older check-in"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="min-w-[3rem] text-center text-xs text-[var(--muted)]">
                  {activeSession + 1}/{sessions.length}
                </span>
                <button
                  type="button"
                  disabled={activeSession <= 0}
                  onClick={() => setActiveSession((i) => Math.max(0, i - 1))}
                  className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--card-border)] disabled:opacity-30"
                  aria-label="Newer check-in"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            ) : null
          }
        >
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {session.weight != null && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)]/15 px-3 py-1 text-sm font-semibold text-[var(--accent)]">
                <Scale size={14} />
                {session.weight} lb
                <span className="font-normal text-[var(--muted)]">
                  ({(session.weight * 0.453592).toFixed(1)} kg)
                </span>
              </span>
            )}
            <span className="text-xs text-[var(--muted)]">
              {session.photos.length} pose{session.photos.length !== 1 ? "s" : ""}
            </span>
            {session.date === today && (
              <span className="rounded-full bg-[#748873]/20 px-2 py-0.5 text-[10px] font-bold uppercase text-[#748873]">
                Latest
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {session.photos.map((photo, idx) => (
              <PhotoTile
                key={photo.id}
                photo={photo}
                large={idx === 0 && session.photos.length >= 3}
                onClick={() => setLightbox(idx)}
              />
            ))}
          </div>
        </Card>
      )}

      {/* Timeline strip */}
      {sessions.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sessions.map((s, i) => (
            <button
              key={s.date}
              type="button"
              onClick={() => setActiveSession(i)}
              className={`shrink-0 rounded-xl border px-3 py-2 text-left transition-colors ${
                i === activeSession
                  ? "border-[var(--accent)] bg-[var(--accent)]/10"
                  : "border-[var(--card-border)] bg-[var(--card)] hover:border-[var(--accent)]/50"
              }`}
            >
              <p className="text-xs font-semibold">{formatJourneyDate(s.date)}</p>
              <p className="text-[10px] text-[var(--muted)]">
                {s.weight != null ? `${s.weight} lb` : "—"} · {s.photos.length} photos
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {session && lightbox != null && session.photos[lightbox] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal
        >
          <button
            type="button"
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((i) => (i == null ? 0 : Math.max(0, i - 1)));
            }}
          >
            <ChevronLeft size={24} />
          </button>
          <div
            className="relative max-h-[90vh] w-full max-w-lg aspect-[3/4]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={getImageUrl(session.photos[lightbox].filename)}
              alt={session.photos[lightbox].caption ?? "Progress"}
              fill
              className="object-contain"
              unoptimized
            />
            <p className="absolute bottom-0 inset-x-0 bg-black/60 py-2 text-center text-sm text-white">
              {session.photos[lightbox].caption}
            </p>
          </div>
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((i) =>
                i == null ? 0 : Math.min(session.photos.length - 1, i + 1)
              );
            }}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}

      <p className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
        <Target size={12} />
        Next milestone: weekly check-in photo + weigh-in until {formatJourneyDate(JOURNEY_END_ISO)}
      </p>
    </div>
  );
}

function StatPill({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-right">
      <p className="flex items-center justify-end gap-1 text-[10px] text-[var(--muted)]">
        {icon}
        {label}
      </p>
      <p className="text-sm font-bold">{value}</p>
      {sub && <p className="text-[10px] text-[var(--muted)]">{sub}</p>}
    </div>
  );
}
