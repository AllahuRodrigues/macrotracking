"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Dumbbell, Droplets, CheckCircle2, Circle, ChevronDown, ChevronUp,
  Play, History, LayoutList, Plus, Minus, RotateCcw,
  Clock, Flame, Pause, Square,
} from "lucide-react";
import type {
  WorkoutTemplate, TemplateExercise, WorkoutSession, SessionExercise, SessionSet,
} from "@/lib/types";
import { WATER_GOAL_ML } from "@/lib/types";
import { formatDateMedium, todayISO, weekdayIndexISO } from "@/lib/utils";
import { Card, Button } from "@/components/ui";
import {
  getTimerState,
  elapsedActiveSeconds,
  formatElapsed,
  userNotesFromSession,
} from "@/lib/session-timer";

type Tab = "today" | "history" | "program";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WATER_STEPS = [250, 500, 750, 1000];

export default function WorkoutPage() {
  const [tab, setTab] = useState<Tab>("today");
  const [date] = useState(todayISO());
  const today = weekdayIndexISO(date);

  const [template, setTemplate] = useState<WorkoutTemplate | null>(null);
  const [templateExercises, setTemplateExercises] = useState<TemplateExercise[]>([]);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [sessionExercises, setSessionExercises] = useState<SessionExercise[]>([]);
  const [waterMl, setWaterMl] = useState(0);
  const [history, setHistory] = useState<WorkoutSession[]>([]);
  const [allTemplates, setAllTemplates] = useState<{ template: WorkoutTemplate; exercises: TemplateExercise[] }[]>([]);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const loadToday = useCallback(async () => {
    try {
      const [tmplRes, sessionRes, waterRes] = await Promise.all([
        fetch(`/api/templates?day=${today}`),
        fetch(`/api/workouts?date=${date}`),
        fetch(`/api/water?date=${date}`),
      ]);
      const tmpl = await tmplRes.json().catch(() => null);
      if (tmpl?.template) {
        setTemplate(tmpl.template);
        setTemplateExercises(Array.isArray(tmpl.exercises) ? tmpl.exercises : []);
      }
      const sess = await sessionRes.json().catch(() => null);
      if (sess?.session) {
        setSession(sess.session);
        setSessionExercises(Array.isArray(sess.exercises) ? sess.exercises : []);
      }
      const water = await waterRes.json().catch(() => ({}));
      setWaterMl(water.total_ml ?? 0);
    } catch (e) {
      console.error("loadToday error", e);
    }
  }, [date, today]);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/workouts?limit=20");
      const data = await res.json().catch(() => []);
      setHistory(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("loadHistory error", e);
    }
  }, []);

  const loadProgram = useCallback(async () => {
    try {
      const res = await fetch("/api/templates");
      const data = await res.json().catch(() => []);
      setAllTemplates(
        Array.isArray(data)
          ? data.map((d: { template: WorkoutTemplate; exercises: TemplateExercise[] }) => ({
              template: d.template,
              exercises: Array.isArray(d.exercises) ? d.exercises : [],
            }))
          : []
      );
    } catch (e) {
      console.error("loadProgram error", e);
    }
  }, []);

  useEffect(() => { loadToday(); }, [loadToday]);
  useEffect(() => { if (tab === "history") loadHistory(); }, [tab, loadHistory]);
  useEffect(() => { if (tab === "program") loadProgram(); }, [tab, loadProgram]);

  const timer = session ? getTimerState(session) : null;

  // Session timer from persisted state
  useEffect(() => {
    if (!timer || timer.status === "completed") {
      if (timer?.status === "completed") setElapsed(elapsedActiveSeconds(timer));
      return;
    }
    const tick = () => setElapsed(elapsedActiveSeconds(timer));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session?.id, timer?.status, timer?.started_at, timer?.paused_total_ms, timer?.pause_started_at]);

  async function startSession() {
    if (!template) return;
    const res = await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "session",
        data: { date, template_id: template.id, name: template.label, cardio_done: 0 },
      }),
    });
    const newSession: WorkoutSession = await res.json();
    setSession(newSession);

    const exData = templateExercises.map((te, i) => ({
      session_id: newSession.id,
      template_exercise_id: te.id,
      name: te.name,
      sets_prescribed: te.sets_prescribed,
      reps_prescribed: te.reps_prescribed,
      sets_data: JSON.stringify([]),
      order_idx: i,
    }));
    await Promise.all(
      exData.map((ex) =>
        fetch("/api/workouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "exercise", data: ex }),
        })
      )
    );
    loadToday();
  }

  async function sessionAction(action: "pause" | "resume" | "complete") {
    if (!session) return;
    await fetch(`/api/workouts/${session.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    loadToday();
  }

  async function logSet(
    exId: string,
    currentSetsData: string,
    weight: number,
    reps: number,
    opts?: { rir?: number | null; to_failure?: boolean }
  ) {
    const sets: SessionSet[] = JSON.parse(currentSetsData || "[]");
    sets.push({
      set_num: sets.length + 1,
      weight_lbs: weight,
      reps,
      done: true,
      rir: opts?.to_failure ? 0 : opts?.rir ?? null,
      to_failure: opts?.to_failure ?? false,
    });
    await fetch(`/api/workouts/${exId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "exercise", data: { sets_data: JSON.stringify(sets) } }),
    });
    loadToday();
  }

  async function markCardio(done: boolean) {
    if (!session) return;
    await fetch(`/api/workouts/${session.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardio_done: done ? 1 : 0, cardio_min: done ? 60 : 0 }),
    });
    loadToday();
  }

  async function addWater(ml: number) {
    const res = await fetch("/api/water", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, amount_ml: ml }),
    });
    const data = await res.json();
    setWaterMl(data.total_ml);
  }

  async function resetWater() {
    await fetch(`/api/water?date=${date}`, { method: "DELETE" });
    setWaterMl(0);
  }

  const waterPct = Math.min(100, Math.round((waterMl / WATER_GOAL_ML) * 100));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workout</h1>
          <p className="text-sm text-[var(--muted)]">{DAY_NAMES[today]} · {formatDateMedium(date)} · Fitness SF</p>
        </div>
        {session && timer && (
          <div className="flex items-center gap-1.5 rounded-lg bg-[var(--accent)]/10 px-3 py-1.5">
            <Clock size={14} className="text-[var(--accent)]" />
            <span className="text-sm font-semibold text-[var(--accent)]">{formatElapsed(elapsed)}</span>
            {timer.status === "paused" && (
              <span className="text-[10px] font-bold uppercase text-[var(--accent-warm)]">Paused</span>
            )}
          </div>
        )}
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 rounded-xl bg-[var(--card)] p-1">
        {(["today", "history", "program"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium capitalize transition-colors ${
              tab === t ? "bg-[var(--accent)] text-black" : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {t === "today" ? <span className="flex items-center justify-center gap-1"><Play size={13} /> Today</span>
             : t === "history" ? <span className="flex items-center justify-center gap-1"><History size={13} /> History</span>
             : <span className="flex items-center justify-center gap-1"><LayoutList size={13} /> Program</span>}
          </button>
        ))}
      </div>

      {/* ══════════════ TODAY TAB ══════════════ */}
      {tab === "today" && (
        <div className="space-y-4">
          {/* Water Tracker */}
          <Card>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Droplets size={18} className="text-blue-400" />
                <span className="font-semibold text-sm">Water</span>
                <span className="text-sm text-[var(--muted)]">{(waterMl / 1000).toFixed(2)}L / 4L</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-xs font-bold ${waterPct >= 100 ? "text-blue-400" : "text-[var(--muted)]"}`}>
                  {waterPct}%
                </span>
                <button onClick={resetWater} className="rounded p-1 text-[var(--muted)] hover:text-red-400">
                  <RotateCcw size={12} />
                </button>
              </div>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[var(--card-border)] mb-3">
              <div
                className="h-full rounded-full bg-blue-400 transition-all duration-300"
                style={{ width: `${waterPct}%` }}
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {WATER_STEPS.map((ml) => (
                <button
                  key={ml}
                  onClick={() => addWater(ml)}
                  className="rounded-lg border border-blue-400/20 bg-blue-400/5 px-2 py-2 text-xs font-semibold text-blue-400 hover:bg-blue-400/15 transition-colors"
                >
                  +{ml >= 1000 ? `${ml / 1000}L` : `${ml}ml`}
                </button>
              ))}
            </div>
          </Card>

          {/* Today's Workout */}
          {template ? (
            <Card>
              <div className="mb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-bold text-lg leading-tight">{template.day_name}</h2>
                    <p className="text-xs text-[var(--muted)] mt-0.5">{template.muscle_groups}</p>
                    <p className="text-xs text-[var(--accent)] mt-1 italic">{template.goal}</p>
                  </div>
                  {!session && (
                    <Button onClick={startSession}>
                      <Play size={14} /> Start
                    </Button>
                  )}
                  {session && timer?.status !== "completed" && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => sessionAction(timer?.status === "paused" ? "resume" : "pause")}
                      >
                        {timer?.status === "paused" ? <Play size={14} /> : <Pause size={14} />}
                        {timer?.status === "paused" ? "Resume" : "Pause"}
                      </Button>
                      <Button onClick={() => sessionAction("complete")}>
                        <Square size={14} /> Finish
                      </Button>
                    </div>
                  )}
                </div>

                {/* Cardio */}
                <div className="mt-3 flex items-center justify-between rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Flame size={15} className="text-orange-400" />
                    <span className="text-sm font-medium text-[var(--muted)]">{template.cardio}</span>
                  </div>
                  <button onClick={() => markCardio(!session?.cardio_done)}>
                    {session?.cardio_done
                      ? <CheckCircle2 size={20} className="text-[var(--accent)]" />
                      : <Circle size={20} className="text-[var(--muted)]" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {(() => {
                  // Use session exercises only when session is linked to today's template
                  const useSession = session && session.template_id === template.id;
                  const displayExercises = useSession
                    ? sessionExercises
                    : templateExercises.map((te) => ({
                        id: te.id,
                        session_id: "",
                        template_exercise_id: te.id,
                        name: te.name,
                        sets_prescribed: te.sets_prescribed,
                        reps_prescribed: te.reps_prescribed,
                        sets_data: "[]",
                        order_idx: te.order_idx,
                        notes: te.notes,
                      }));
                  return displayExercises.map((ex) => (
                    <ExerciseRow
                      key={ex.id}
                      ex={ex as SessionExercise}
                      sessionActive={!!useSession}
                      expanded={expandedExercise === ex.id}
                      onToggle={() => setExpandedExercise(expandedExercise === ex.id ? null : ex.id)}
                      onLogSet={(w, r, opts) =>
                        logSet(ex.id, (ex as SessionExercise).sets_data ?? "[]", w, r, opts)
                      }
                    />
                  ));
                })()}
              </div>
            </Card>
          ) : (
            <Card>
              <div className="py-8 text-center">
                <p className="text-2xl mb-2">😴</p>
                <p className="font-semibold">Rest Day</p>
                <p className="text-sm text-[var(--muted)] mt-1">8,000–12,000 steps · stretch · eat 200g protein · sleep well</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ══════════════ HISTORY TAB ══════════════ */}
      {tab === "history" && (
        <div className="space-y-3">
          {history.length === 0 ? (
            <Card><p className="py-8 text-center text-sm text-[var(--muted)]">No workout history yet. Start your first session.</p></Card>
          ) : (
            history.map((s) => {
              const t = getTimerState(s);
              const note = userNotesFromSession(s.notes);
              return (
                <Card key={s.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-sm">{s.name}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {s.date}
                        {t ? ` · ${formatElapsed(elapsedActiveSeconds(t))}` : ""}
                      </p>
                      {note ? (
                        <p className="mt-1 text-xs text-[var(--muted)]">{note}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-1 text-right text-xs">
                      {t?.status === "completed" ? (
                        <span className="font-semibold text-[var(--accent)]">Done</span>
                      ) : t?.status === "paused" ? (
                        <span className="font-semibold text-[var(--accent-warm)]">Paused</span>
                      ) : t?.status === "active" ? (
                        <span className="font-semibold text-[var(--accent)]">Live</span>
                      ) : null}
                      {s.duration_min ? (
                        <div>
                          <p className="text-[var(--muted)]">Logged</p>
                          <p className="font-semibold">{s.duration_min} min</p>
                        </div>
                      ) : null}
                      <div>
                        <p className="text-[var(--muted)]">Cardio</p>
                        <p
                          className={
                            s.cardio_done
                              ? "font-semibold text-[var(--accent)]"
                              : "text-[var(--muted)]"
                          }
                        >
                          {s.cardio_done ? `✓ ${s.cardio_min ?? 60} min` : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* ══════════════ PROGRAM TAB ══════════════ */}
      {tab === "program" && (
        <div className="space-y-3">
          {allTemplates.map(({ template: t, exercises }) => (
            <ProgramDay key={t.id} template={t} exercises={exercises} isToday={t.week_day === today} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── ExerciseRow Component ──

interface ExerciseRowProps {
  ex: SessionExercise;
  sessionActive: boolean;
  expanded: boolean;
  onToggle: () => void;
  onLogSet: (weight: number, reps: number, opts?: { rir?: number | null; to_failure?: boolean }) => void;
}

function ExerciseRow({ ex, sessionActive, expanded, onToggle, onLogSet }: ExerciseRowProps) {
  const sets: SessionSet[] = JSON.parse(ex.sets_data || "[]");
  const doneSets = sets.filter((s) => s.done).length;
  const totalPrescribed = parseInt(ex.sets_prescribed) || 3;
  const complete = doneSets >= totalPrescribed;
  const lastSet = sets[sets.length - 1];

  const defaultReps = parseInt((ex.reps_prescribed?.split("–")[0] ?? "8")) || 8;
  const [weight, setWeight] = useState(lastSet?.weight_lbs ?? 0);
  const [reps, setReps] = useState(lastSet?.reps ?? defaultReps);
  const [rir, setRir] = useState(2);
  const [toFailure, setToFailure] = useState(false);

  return (
    <div className={`rounded-lg border transition-colors ${complete ? "border-[var(--accent)]/30 bg-[var(--accent)]/5" : "border-[var(--card-border)] bg-[var(--background)]"}`}>
      <button className="flex w-full items-center justify-between px-3 py-2.5 text-left" onClick={onToggle}>
        <div className="flex items-center gap-2.5 min-w-0">
          {complete
            ? <CheckCircle2 size={16} className="text-[var(--accent)] shrink-0" />
            : <Circle size={16} className="text-[var(--muted)] shrink-0" />}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{ex.name}</p>
            <p className="text-xs text-[var(--muted)]">{ex.sets_prescribed} × {ex.reps_prescribed}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {doneSets > 0 && (
            <span className={`text-xs font-semibold ${complete ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}>
              {doneSets}/{totalPrescribed}
            </span>
          )}
          {expanded ? <ChevronUp size={16} className="text-[var(--muted)]" /> : <ChevronDown size={16} className="text-[var(--muted)]" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[var(--card-border)] px-3 py-3 space-y-3">
          {ex.notes && <p className="text-xs text-[var(--muted)] italic">{ex.notes}</p>}

          {/* Logged sets */}
          {sets.length > 0 && (
            <div className="space-y-1">
              {sets.map((s) => (
                <div key={s.set_num} className="flex items-center gap-3 text-xs">
                  <span className="w-10 text-[var(--muted)]">Set {s.set_num}</span>
                  <span className="font-semibold">{s.weight_lbs} lbs</span>
                  <span className="text-[var(--muted)]">×</span>
                  <span className="font-semibold">{s.reps} reps</span>
                  {s.to_failure ? (
                    <span className="font-bold text-red-400">FAIL</span>
                  ) : s.rir != null ? (
                    <span className="text-[var(--muted)]">RIR {s.rir}</span>
                  ) : null}
                  <CheckCircle2 size={12} className="text-[var(--accent)]" />
                </div>
              ))}
            </div>
          )}

          {/* Log new set */}
          {sessionActive && (
            <div className="space-y-2">
              <div className="flex items-end gap-2">
                <label className="block space-y-1 flex-1">
                  <span className="text-[10px] text-[var(--muted)]">Weight (lbs)</span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setWeight(Math.max(0, weight - 5))} className="rounded bg-[var(--card-border)] p-1"><Minus size={12} /></button>
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                      className="w-full rounded border border-[var(--card-border)] bg-[var(--background)] px-2 py-1 text-center text-sm"
                    />
                    <button type="button" onClick={() => setWeight(weight + 5)} className="rounded bg-[var(--card-border)] p-1"><Plus size={12} /></button>
                  </div>
                </label>
                <label className="block space-y-1 flex-1">
                  <span className="text-[10px] text-[var(--muted)]">Reps</span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setReps(Math.max(1, reps - 1))} className="rounded bg-[var(--card-border)] p-1"><Minus size={12} /></button>
                    <input
                      type="number"
                      value={reps}
                      onChange={(e) => setReps(parseInt(e.target.value) || 1)}
                      className="w-full rounded border border-[var(--card-border)] bg-[var(--background)] px-2 py-1 text-center text-sm"
                    />
                    <button type="button" onClick={() => setReps(reps + 1)} className="rounded bg-[var(--card-border)] p-1"><Plus size={12} /></button>
                  </div>
                </label>
                <Button
                  onClick={() => onLogSet(weight, reps, { rir: toFailure ? 0 : rir, to_failure: toFailure })}
                  className="shrink-0"
                >
                  <CheckCircle2 size={14} /> Log
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[0, 1, 2, 3].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      setToFailure(false);
                      setRir(n);
                    }}
                    className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
                      !toFailure && rir === n
                        ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
                        : "border-[var(--card-border)] text-[var(--muted)]"
                    }`}
                  >
                    RIR {n}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setToFailure(!toFailure)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
                    toFailure
                      ? "border-red-400 bg-red-400/15 text-red-400"
                      : "border-[var(--card-border)] text-[var(--muted)]"
                  }`}
                >
                  To failure
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── ProgramDay Component ──

function ProgramDay({
  template,
  exercises,
  isToday,
}: {
  template: WorkoutTemplate;
  exercises: TemplateExercise[];
  isToday: boolean;
}) {
  const [open, setOpen] = useState(isToday);
  const dayName = DAY_NAMES[template.week_day];

  return (
    <Card className={isToday ? "!border-[var(--accent)]/40" : ""}>
      <button className="flex w-full items-start justify-between text-left" onClick={() => setOpen(!open)}>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold">{dayName}</p>
            {isToday && <span className="rounded-full bg-[var(--accent)]/15 px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)] uppercase">Today</span>}
          </div>
          <p className="text-sm text-[var(--muted)]">{template.day_name} · {template.muscle_groups}</p>
        </div>
        {open ? <ChevronUp size={16} className="text-[var(--muted)] shrink-0 mt-1" /> : <ChevronDown size={16} className="text-[var(--muted)] shrink-0 mt-1" />}
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          <p className="text-xs italic text-[var(--accent)]">{template.goal}</p>
          {(Array.isArray(exercises) ? exercises : []).map((e, i) => (
            <div key={e.id} className="flex items-start gap-2.5 py-1.5 border-t border-[var(--card-border)] first:border-0">
              <span className="mt-0.5 text-xs text-[var(--muted)] w-4 shrink-0">{i + 1}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium">{e.name}</p>
                <p className="text-xs text-[var(--muted)]">{e.sets_prescribed} sets × {e.reps_prescribed}</p>
                {e.notes && <p className="text-xs text-[var(--muted)] italic mt-0.5">{e.notes}</p>}
              </div>
            </div>
          ))}
          <div className="mt-2 rounded-lg bg-orange-500/10 border border-orange-500/20 px-3 py-2">
            <p className="text-xs font-semibold text-orange-400">Cardio</p>
            <p className="text-xs text-[var(--muted)]">{template.cardio}</p>
          </div>
        </div>
      )}
    </Card>
  );
}
