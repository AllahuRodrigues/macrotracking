import React, { useState } from "react";
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

type Tab = "today" | "program" | "history";
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Workout() {
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

  const active = sessionQ.data;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        refreshControl={
          <RefreshControl refreshing={todayTemplate.isFetching} onRefresh={refresh} tintColor={theme.colors.accent} />
        }
      >
        <ScreenTitle title="Workout" subtitle={`${DAY_NAMES[today]} · ${formatDateMedium(date)}`} />

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
                  <Row style={{ gap: 8, marginTop: 12 }}>
                    <Pill label="Session live" color={theme.colors.accent} />
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
                  </Row>
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
          ? (history.data ?? []).map((s) => (
              <Card key={s.id} style={{ marginBottom: 8 }}>
                <Row style={{ justifyContent: "space-between" }}>
                  <View style={{ flex: 1 }}>
                    <AppText bold size={14}>{s.name}</AppText>
                    <AppText muted size={12}>{s.date}</AppText>
                  </View>
                  {s.cardio_done ? (
                    <Pill label={`Cardio ${s.cardio_min ?? 30}m`} color={theme.colors.accentWarm} />
                  ) : null}
                </Row>
              </Card>
            ))
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
      await api.logSet(exercise, w, r);
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
    paddingVertical: 8,
    fontSize: 15,
    minWidth: 64,
    textAlign: "center" as const,
  };

  return (
    <Card style={{ marginBottom: 10 }}>
      <Row style={{ justifyContent: "space-between", marginBottom: 6 }}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <AppText bold size={14}>{exercise.name}</AppText>
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
            </AppText>
          ))}
        </View>
      ) : null}

      {canWrite ? (
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
              paddingHorizontal: 14,
              paddingVertical: 10,
              opacity: busy ? 0.5 : 1,
            }}
          >
            {busy ? (
              <ActivityIndicator color="#04140b" />
            ) : (
              <Text style={{ color: "#04140b", fontWeight: "800", fontSize: 13 }}>Log</Text>
            )}
          </Pressable>
        </Row>
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
