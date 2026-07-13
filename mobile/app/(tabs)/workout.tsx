import React, { useState, useEffect } from "react";
import {
  ScrollView,
  View,
  Pressable,
  Text,
  TextInput,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import { todayISO, weekdayIndexISO, formatDateMedium } from "@shared/timezone";
import type {
  TemplateExercise,
  WorkoutTemplate,
  SessionExercise,
  SessionSet,
} from "@shared/types";
import {
  useTemplateForDay,
  useProgram,
  useHistory,
  useTodaySession,
} from "@/api/queries";
import { api } from "@/api/client";
import { useAuth } from "@/lib/AuthContext";
import { Card, AppText, ScreenTitle, Row, Pill, Button } from "@/components/ui";
import { theme } from "@/lib/theme";
import {
  getTimerState,
  elapsedActiveSeconds,
  formatElapsed,
  userNotesFromSession,
} from "@shared/session-timer";

type Tab = "today" | "program" | "history";
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Workout({ embedded = false }: { embedded?: boolean }) {
  const [tab, setTab] = useState<Tab>("today");
  const date = todayISO();
  const today = weekdayIndexISO(date);
  const { canWrite } = useAuth();
  const qc = useQueryClient();
  const todayTemplate = useTemplateForDay(today);
  const program = useProgram();
  const history = useHistory(20);
  const sessionQ = useTodaySession(date);
  const [starting, setStarting] = useState(false);
  const [tick, setTick] = useState(0);

  const active = sessionQ.data;
  const timer = active?.session ? getTimerState(active.session) : null;

  useEffect(() => {
    if (!timer || timer.status === "completed") return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [timer?.status, timer?.started_at]);

  const elapsed = timer ? elapsedActiveSeconds(timer) : 0;
  void tick;

  const refresh = () => {
    todayTemplate.refetch();
    program.refetch();
    history.refetch();
    sessionQ.refetch();
  };

  const startSession = async () => {
    const t = todayTemplate.data;
    if (!t?.template || !canWrite) return;
    setStarting(true);
    try {
      const session = await api.startSession({
        date,
        template_id: t.template.id,
        name: t.template.label,
        cardio_done: 0,
      });
      await Promise.all(
        t.exercises.map((te, i) =>
          api.upsertSessionExercise({
            session_id: session.id,
            template_exercise_id: te.id,
            name: te.name,
            sets_prescribed: te.sets_prescribed,
            reps_prescribed: te.reps_prescribed,
            sets_data: "[]",
            order_idx: i,
          })
        )
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ["session", date] });
      sessionQ.refetch();
    } catch (e) {
      Alert.alert("Could not start", (e as Error).message);
    } finally {
      setStarting(false);
    }
  };

  const runAction = async (action: "pause" | "resume" | "complete") => {
    if (!active?.session) return;
    try {
      await api.sessionAction(active.session.id, action);
      Haptics.selectionAsync();
      sessionQ.refetch();
    } catch (e) {
      Alert.alert("Session", (e as Error).message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={embedded ? [] : ["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        refreshControl={
          <RefreshControl refreshing={todayTemplate.isFetching} onRefresh={refresh} tintColor={theme.colors.accent} />
        }
      >
        {!embedded ? (
          <ScreenTitle title="Workout" subtitle={`${DAY_NAMES[today]} · ${formatDateMedium(date)}`} />
        ) : (
          <AppText muted size={13} style={{ marginBottom: 10 }}>
            {DAY_NAMES[today]} · {formatDateMedium(date)} · Start below
          </AppText>
        )}

        <Row style={{ gap: 6, marginBottom: 16, backgroundColor: theme.colors.card, borderRadius: theme.radius.md, padding: 4 }}>
          {(["today", "program", "history"] as Tab[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: theme.radius.sm,
                alignItems: "center",
                backgroundColor: tab === t ? theme.colors.accent : "transparent",
              }}
            >
              <Text
                style={{
                  color: tab === t ? "#04140b" : theme.colors.muted,
                  fontWeight: "700",
                  fontSize: 13,
                  textTransform: "capitalize",
                }}
              >
                {t}
              </Text>
            </Pressable>
          ))}
        </Row>

        {tab === "today" ? (
          <>
            {todayTemplate.data?.template ? (
              <Card style={{ marginBottom: 12, borderColor: `${theme.colors.accent}55` }}>
                <AppText bold size={16}>{todayTemplate.data.template.label}</AppText>
                <AppText muted size={12} style={{ marginTop: 2 }}>
                  {todayTemplate.data.template.muscle_groups}
                </AppText>
                <AppText size={12} color={theme.colors.accent} style={{ marginTop: 6, fontStyle: "italic" }}>
                  {todayTemplate.data.template.goal}
                </AppText>

                {!active?.session && canWrite ? (
                  <Button
                    label={starting ? "Starting…" : "Start session — log sets"}
                    onPress={startSession}
                    loading={starting}
                    style={{ marginTop: 14 }}
                  />
                ) : null}

                {active?.session ? (
                  <View style={{ marginTop: 12, gap: 10 }}>
                    <Row style={{ justifyContent: "space-between", alignItems: "center" }}>
                      <Pill
                        label={
                          timer?.status === "paused"
                            ? "Paused"
                            : timer?.status === "completed"
                              ? "Done"
                              : "Live"
                        }
                        color={
                          timer?.status === "paused"
                            ? theme.colors.accentWarm
                            : theme.colors.accent
                        }
                      />
                      <AppText bold size={20} color={theme.colors.accent}>
                        {formatElapsed(elapsed)}
                      </AppText>
                    </Row>
                    {canWrite && timer?.status !== "completed" ? (
                      <Row style={{ gap: 8 }}>
                        <Pressable
                          onPress={() => runAction(timer?.status === "paused" ? "resume" : "pause")}
                          style={{
                            flex: 1,
                            minHeight: 48,
                            borderRadius: theme.radius.md,
                            backgroundColor: theme.colors.cardBorder,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <AppText bold>
                            {timer?.status === "paused" ? "Resume" : "Pause"}
                          </AppText>
                        </Pressable>
                        <Pressable
                          onPress={() =>
                            Alert.alert("Finish workout?", "Saves duration and locks the timer.", [
                              { text: "Cancel", style: "cancel" },
                              { text: "Finish", onPress: () => runAction("complete") },
                            ])
                          }
                          style={{
                            flex: 1,
                            minHeight: 48,
                            borderRadius: theme.radius.md,
                            backgroundColor: theme.colors.accent,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <AppText bold color="#04140b">
                            Finish
                          </AppText>
                        </Pressable>
                      </Row>
                    ) : null}
                    <Pressable
                      onPress={() =>
                        api
                          .markCardio(active.session.id, !active.session.cardio_done)
                          .then(() => sessionQ.refetch())
                      }
                    >
                      <Pill
                        label={active.session.cardio_done ? "Cardio ✓" : "Mark cardio"}
                        color={theme.colors.accentWarm}
                      />
                    </Pressable>
                  </View>
                ) : null}
              </Card>
            ) : (
              <Card style={{ marginBottom: 12 }}>
                <AppText muted>Recovery day — hit 12–15k steps, mobility, optional sauna.</AppText>
              </Card>
            )}

            {active?.exercises?.length
              ? active.exercises.map((ex) => (
                  <ExerciseLogger
                    key={ex.id}
                    exercise={ex}
                    canWrite={canWrite}
                    onLogged={() => sessionQ.refetch()}
                  />
                ))
              : todayTemplate.data?.exercises?.map((e, i) => (
                  <Card key={e.id} style={{ marginBottom: 8, paddingVertical: 12 }}>
                    <Row>
                      <AppText muted size={12} style={{ width: 22 }}>{i + 1}</AppText>
                      <View style={{ flex: 1 }}>
                        <AppText size={14} bold>{e.name}</AppText>
                        <AppText muted size={12}>
                          {e.sets_prescribed} × {e.reps_prescribed}
                          {e.notes ? ` · ${e.notes}` : ""}
                        </AppText>
                      </View>
                    </Row>
                  </Card>
                ))}

            {todayTemplate.data?.template?.cardio ? (
              <Card style={{ backgroundColor: `${theme.colors.accentWarm}14` }}>
                <AppText bold size={12} color={theme.colors.accentWarm}>Cardio finish</AppText>
                <AppText muted size={13}>{todayTemplate.data.template.cardio}</AppText>
              </Card>
            ) : null}
          </>
        ) : null}

        {tab === "program"
          ? (program.data ?? []).map((d) => (
              <DayCard
                key={d.template.id}
                template={d.template}
                exercises={d.exercises}
                isToday={d.template.week_day === today}
              />
            ))
          : null}

        {tab === "history"
          ? (history.data ?? []).map((s) => {
              const t = getTimerState(s);
              const note = userNotesFromSession(s.notes);
              return (
                <Card key={s.id} style={{ marginBottom: 8 }}>
                  <Row style={{ justifyContent: "space-between" }}>
                    <View style={{ flex: 1 }}>
                      <AppText bold size={14}>
                        {s.name}
                      </AppText>
                      <AppText muted size={12}>
                        {s.date}
                        {t ? ` · ${formatElapsed(elapsedActiveSeconds(t))}` : ""}
                      </AppText>
                      {note ? (
                        <AppText muted size={11} style={{ marginTop: 4 }}>
                          {note}
                        </AppText>
                      ) : null}
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 4 }}>
                      {t?.status === "completed" ? (
                        <Pill label="Done" color={theme.colors.accent} />
                      ) : t?.status === "paused" ? (
                        <Pill label="Paused" color={theme.colors.accentWarm} />
                      ) : t?.status === "active" ? (
                        <Pill label="Live" color={theme.colors.accent} />
                      ) : null}
                      {s.cardio_done ? (
                        <Pill label={`Cardio ${s.cardio_min ?? 30}m`} color={theme.colors.accentWarm} />
                      ) : null}
                    </View>
                  </Row>
                </Card>
              );
            })
          : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ExerciseLogger({
  exercise,
  canWrite,
  onLogged,
}: {
  exercise: SessionExercise;
  canWrite: boolean;
  onLogged: () => void;
}) {
  const sets: SessionSet[] = JSON.parse(exercise.sets_data || "[]");
  const [weight, setWeight] = useState(sets.length ? String(sets[sets.length - 1].weight_lbs ?? "") : "");
  const [reps, setReps] = useState(sets.length ? String(sets[sets.length - 1].reps ?? "") : "");
  const [rir, setRir] = useState(2);
  const [toFailure, setToFailure] = useState(false);
  const [busy, setBusy] = useState(false);

  const prescribed = parseInt(exercise.sets_prescribed, 10) || 3;
  const done = sets.length;

  const log = async () => {
    if (!canWrite) return;
    const w = parseFloat(weight) || 0;
    const r = parseInt(reps, 10) || 0;
    if (!r) {
      Alert.alert("Add reps", "Enter how many reps you completed.");
      return;
    }
    setBusy(true);
    try {
      await api.logSet(exercise, w, r, {
        rir: toFailure ? 0 : rir,
        to_failure: toFailure,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onLogged();
    } catch (e) {
      Alert.alert("Log failed", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const input = {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.cardBorder,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    color: theme.colors.foreground,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 16,
    minWidth: 68,
    minHeight: 44,
    textAlign: "center" as const,
  };

  return (
    <Card style={{ marginBottom: 10 }}>
      <Row style={{ justifyContent: "space-between", marginBottom: 6 }}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <AppText bold size={15}>{exercise.name}</AppText>
          <AppText muted size={11}>
            Target {exercise.sets_prescribed} × {exercise.reps_prescribed}
          </AppText>
        </View>
        <Pill
          label={`${done}/${prescribed}`}
          color={done >= prescribed ? theme.colors.accent : theme.colors.muted}
        />
      </Row>

      {sets.length > 0 ? (
        <View style={{ marginBottom: 8 }}>
          {sets.map((s) => (
            <AppText key={s.set_num} muted size={12}>
              Set {s.set_num}: {s.weight_lbs ?? 0} lb × {s.reps ?? 0}
              {s.to_failure ? " · FAIL" : s.rir != null ? ` · RIR ${s.rir}` : ""}
            </AppText>
          ))}
        </View>
      ) : null}

      {canWrite ? (
        <View style={{ gap: 10 }}>
          <Row style={{ gap: 8, alignItems: "center" }}>
            <TextInput
              style={input}
              keyboardType="decimal-pad"
              placeholder="lb"
              placeholderTextColor={theme.colors.muted}
              value={weight}
              onChangeText={setWeight}
            />
            <AppText muted>×</AppText>
            <TextInput
              style={input}
              keyboardType="number-pad"
              placeholder="reps"
              placeholderTextColor={theme.colors.muted}
              value={reps}
              onChangeText={setReps}
            />
            <Pressable
              onPress={log}
              disabled={busy}
              style={{
                backgroundColor: theme.colors.accent,
                borderRadius: theme.radius.sm,
                paddingHorizontal: 16,
                paddingVertical: 12,
                minHeight: 44,
                justifyContent: "center",
                opacity: busy ? 0.5 : 1,
              }}
            >
              {busy ? (
                <ActivityIndicator color="#04140b" />
              ) : (
                <Text style={{ color: "#04140b", fontWeight: "800", fontSize: 14 }}>Log</Text>
              )}
            </Pressable>
          </Row>
          <Row style={{ gap: 8, flexWrap: "wrap" }}>
            {[0, 1, 2, 3].map((n) => (
              <Pressable
                key={n}
                onPress={() => {
                  setToFailure(false);
                  setRir(n);
                }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: theme.radius.sm,
                  backgroundColor: !toFailure && rir === n ? `${theme.colors.accent}33` : theme.colors.background,
                  borderWidth: 1,
                  borderColor: !toFailure && rir === n ? theme.colors.accent : theme.colors.cardBorder,
                }}
              >
                <AppText size={12} bold>
                  RIR {n}
                </AppText>
              </Pressable>
            ))}
            <Pressable
              onPress={() => setToFailure(!toFailure)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: theme.radius.sm,
                backgroundColor: toFailure ? `${theme.colors.red}33` : theme.colors.background,
                borderWidth: 1,
                borderColor: toFailure ? theme.colors.red : theme.colors.cardBorder,
              }}
            >
              <AppText size={12} bold color={toFailure ? theme.colors.red : undefined}>
                To failure
              </AppText>
            </Pressable>
          </Row>
        </View>
      ) : null}
    </Card>
  );
}

function DayCard({
  template,
  exercises,
  isToday,
}: {
  template: WorkoutTemplate;
  exercises: TemplateExercise[];
  isToday: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Card style={{ marginBottom: 10, borderColor: isToday ? `${theme.colors.accent}66` : theme.colors.cardBorder }}>
      <Pressable onPress={() => setOpen(!open)}>
        <Row style={{ justifyContent: "space-between" }}>
          <View style={{ flex: 1 }}>
            <Row style={{ gap: 8 }}>
              <AppText bold size={15}>{template.label}</AppText>
              {isToday ? <Pill label="Today" /> : null}
            </Row>
            <AppText muted size={12} style={{ marginTop: 2 }}>{template.muscle_groups}</AppText>
          </View>
          <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={theme.colors.muted} />
        </Row>
      </Pressable>
      {open ? (
        <View style={{ marginTop: 12 }}>
          {(exercises ?? []).map((e, i) => (
            <Row key={e.id} style={{ paddingVertical: 6, borderTopWidth: i ? 1 : 0, borderTopColor: theme.colors.cardBorder }}>
              <AppText muted size={12} style={{ width: 22 }}>{i + 1}</AppText>
              <View style={{ flex: 1 }}>
                <AppText size={14}>{e.name}</AppText>
                <AppText muted size={12}>
                  {e.sets_prescribed} × {e.reps_prescribed}
                  {e.notes ? ` · ${e.notes}` : ""}
                </AppText>
              </View>
            </Row>
          ))}
        </View>
      ) : null}
    </Card>
  );
}
