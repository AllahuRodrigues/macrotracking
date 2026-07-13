import React, { useState } from "react";
import { ScrollView, View, Pressable, Text, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { todayISO, weekdayIndexISO, formatDateMedium } from "@shared/timezone";
import type { TemplateExercise, WorkoutTemplate } from "@shared/types";
import { useTemplateForDay, useProgram, useHistory } from "@/api/queries";
import { Card, AppText, ScreenTitle, Row, Pill } from "@/components/ui";
import { theme } from "@/lib/theme";

type Tab = "today" | "program" | "history";
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function Workout() {
  const [tab, setTab] = useState<Tab>("today");
  const date = todayISO();
  const today = weekdayIndexISO(date);
  const todayTemplate = useTemplateForDay(today);
  const program = useProgram();
  const history = useHistory(20);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={todayTemplate.isFetching || program.isFetching}
            onRefresh={() => {
              todayTemplate.refetch();
              program.refetch();
              history.refetch();
            }}
            tintColor={theme.colors.accent}
          />
        }
      >
        <ScreenTitle title="Workout" subtitle={`${DAY_NAMES[today]} · ${formatDateMedium(date)}`} />

        <Row style={{ gap: 6, marginBottom: 16, backgroundColor: theme.colors.card, borderRadius: theme.radius.md, padding: 4 }}>
          {(["today", "program", "history"] as Tab[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={{ flex: 1, paddingVertical: 8, borderRadius: theme.radius.sm, alignItems: "center", backgroundColor: tab === t ? theme.colors.accent : "transparent" }}
            >
              <Text style={{ color: tab === t ? "#04140b" : theme.colors.muted, fontWeight: "700", fontSize: 13, textTransform: "capitalize" }}>{t}</Text>
            </Pressable>
          ))}
        </Row>

        {tab === "today" ? (
          todayTemplate.data?.template ? (
            <DayCard template={todayTemplate.data.template} exercises={todayTemplate.data.exercises} isToday defaultOpen />
          ) : (
            <Card><AppText muted>Rest day — 8,000–12,000 steps, stretch, mobility.</AppText></Card>
          )
        ) : null}

        {tab === "program"
          ? (program.data ?? []).map((d) => (
              <DayCard key={d.template.id} template={d.template} exercises={d.exercises} isToday={d.template.week_day === today} />
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
                  {s.cardio_done ? <Pill label={`Cardio ${s.cardio_min ?? 60}m`} color={theme.colors.accentWarm} /> : null}
                </Row>
                {s.notes ? <AppText muted size={12} style={{ marginTop: 6 }}>{s.notes}</AppText> : null}
              </Card>
            ))
          : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function DayCard({
  template,
  exercises,
  isToday,
  defaultOpen,
}: {
  template: WorkoutTemplate;
  exercises: TemplateExercise[];
  isToday: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
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
          <AppText size={12} color={theme.colors.accent} style={{ fontStyle: "italic", marginBottom: 8 }}>{template.goal}</AppText>
          {(exercises ?? []).map((e, i) => (
            <Row key={e.id} style={{ paddingVertical: 6, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: theme.colors.cardBorder }}>
              <AppText muted size={12} style={{ width: 22 }}>{i + 1}</AppText>
              <View style={{ flex: 1 }}>
                <AppText size={14}>{e.name}</AppText>
                <AppText muted size={12}>{e.sets_prescribed} × {e.reps_prescribed}{e.notes ? ` · ${e.notes}` : ""}</AppText>
              </View>
            </Row>
          ))}
          <View style={{ marginTop: 8, backgroundColor: `${theme.colors.accentWarm}18`, borderRadius: theme.radius.sm, padding: 10 }}>
            <AppText size={11} bold color={theme.colors.accentWarm}>Cardio</AppText>
            <AppText muted size={12}>{template.cardio}</AppText>
          </View>
        </View>
      ) : null}
    </Card>
  );
}
