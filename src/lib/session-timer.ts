/**
 * Workout session timer helpers — pause / resume / complete.
 * Works even if DB columns are missing by falling back to notes JSON.
 */

import type { WorkoutSession, WorkoutSessionStatus } from "./types";

export type SessionTimerState = {
  status: WorkoutSessionStatus;
  started_at: string;
  ended_at?: string | null;
  paused_total_ms: number;
  pause_started_at?: string | null;
};

const META_PREFIX = "__mt:";

export function parseTimerFromNotes(notes?: string | null): SessionTimerState | null {
  if (!notes?.startsWith(META_PREFIX)) return null;
  try {
    const raw = JSON.parse(notes.slice(META_PREFIX.length));
    if (raw?.timer?.started_at) {
      return {
        status: raw.timer.status ?? "active",
        started_at: raw.timer.started_at,
        ended_at: raw.timer.ended_at ?? null,
        paused_total_ms: raw.timer.paused_total_ms ?? 0,
        pause_started_at: raw.timer.pause_started_at ?? null,
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function userNotesFromSession(notes?: string | null): string {
  if (!notes) return "";
  if (!notes.startsWith(META_PREFIX)) return notes;
  try {
    const raw = JSON.parse(notes.slice(META_PREFIX.length));
    return typeof raw.user_notes === "string" ? raw.user_notes : "";
  } catch {
    return "";
  }
}

export function encodeSessionNotes(timer: SessionTimerState, userNotes = ""): string {
  return META_PREFIX + JSON.stringify({ timer, user_notes: userNotes });
}

export function getTimerState(session: WorkoutSession): SessionTimerState | null {
  if (session.started_at) {
    return {
      status: (session.status as WorkoutSessionStatus) ?? "active",
      started_at: session.started_at,
      ended_at: session.ended_at ?? null,
      paused_total_ms: session.paused_total_ms ?? 0,
      pause_started_at: session.pause_started_at ?? null,
    };
  }
  return parseTimerFromNotes(session.notes);
}

/** Elapsed active training seconds (excludes pauses). */
export function elapsedActiveSeconds(timer: SessionTimerState, now = Date.now()): number {
  const start = new Date(timer.started_at).getTime();
  let paused = timer.paused_total_ms ?? 0;
  if (timer.status === "paused" && timer.pause_started_at) {
    paused += now - new Date(timer.pause_started_at).getTime();
  }
  const end =
    timer.status === "completed" && timer.ended_at
      ? new Date(timer.ended_at).getTime()
      : now;
  return Math.max(0, Math.floor((end - start - paused) / 1000));
}

export function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function applyTimerAction(
  session: WorkoutSession,
  action: "pause" | "resume" | "complete",
  nowISO = new Date().toISOString()
): Partial<WorkoutSession> {
  const timer = getTimerState(session) ?? {
    status: "active" as const,
    started_at: session.created_at || nowISO,
    paused_total_ms: 0,
    pause_started_at: null,
    ended_at: null,
  };
  const userNotes = userNotesFromSession(session.notes);
  const next = { ...timer };

  if (action === "pause" && next.status === "active") {
    next.status = "paused";
    next.pause_started_at = nowISO;
  } else if (action === "resume" && next.status === "paused") {
    if (next.pause_started_at) {
      next.paused_total_ms +=
        new Date(nowISO).getTime() - new Date(next.pause_started_at).getTime();
    }
    next.pause_started_at = null;
    next.status = "active";
  } else if (action === "complete") {
    if (next.status === "paused" && next.pause_started_at) {
      next.paused_total_ms +=
        new Date(nowISO).getTime() - new Date(next.pause_started_at).getTime();
      next.pause_started_at = null;
    }
    next.status = "completed";
    next.ended_at = nowISO;
  }

  const duration_min = Math.max(1, Math.round(elapsedActiveSeconds(next, new Date(nowISO).getTime()) / 60));

  return {
    status: next.status,
    started_at: next.started_at,
    ended_at: next.ended_at ?? null,
    paused_total_ms: next.paused_total_ms,
    pause_started_at: next.pause_started_at ?? null,
    duration_min: action === "complete" ? duration_min : session.duration_min,
    notes: encodeSessionNotes(next, userNotes),
  };
}

export function initialTimerFields(nowISO = new Date().toISOString()): Partial<WorkoutSession> {
  const timer: SessionTimerState = {
    status: "active",
    started_at: nowISO,
    paused_total_ms: 0,
    pause_started_at: null,
    ended_at: null,
  };
  return {
    status: "active",
    started_at: nowISO,
    ended_at: null,
    paused_total_ms: 0,
    pause_started_at: null,
    notes: encodeSessionNotes(timer, ""),
  };
}
