import React, { useState } from "react";
import { ScrollView, View, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { todayISO } from "@shared/timezone";
import { useSupplementIntake, useToggleSupplement } from "@/api/queries";
import { useAuth } from "@/lib/AuthContext";
import { DateNav } from "@/components/DateNav";
import { Card, AppText, ScreenTitle, Row, Pill } from "@/components/ui";
import { theme } from "@/lib/theme";

export default function Supplements() {
  const [date, setDate] = useState(todayISO());
  const { canWrite } = useAuth();
  const intake = useSupplementIntake(date);
  const toggle = useToggleSupplement(date);

  const data = intake.data;
  const due = data?.due_supplements ?? [];
  const takenIds = new Set(data?.taken_ids ?? []);
  const taken = data?.taken ?? 0;
  const total = data?.total ?? due.length;
  const pct = total > 0 ? Math.round((taken / total) * 100) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={intake.isFetching} onRefresh={() => intake.refetch()} tintColor={theme.colors.accent} />}
      >
        <ScreenTitle title="Supplements" />
        <DateNav date={date} onChange={setDate} />

        <Card style={{ marginBottom: 16 }}>
          <Row style={{ justifyContent: "space-between", marginBottom: 8 }}>
            <AppText bold>Today's stack</AppText>
            <Pill label={`${taken}/${total} · ${pct}%`} />
          </Row>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: theme.colors.cardBorder, overflow: "hidden" }}>
            <View style={{ width: `${pct}%`, height: "100%", backgroundColor: theme.colors.accent }} />
          </View>
        </Card>

        {due.map((s) => {
          const isTaken = takenIds.has(s.id);
          return (
            <Pressable
              key={s.id}
              disabled={!canWrite}
              onPress={() => toggle.mutate({ id: s.id, taken: !isTaken })}
              style={{ marginBottom: 8 }}
            >
              <Card style={{ paddingVertical: 12, borderColor: isTaken ? `${theme.colors.accent}55` : theme.colors.cardBorder }}>
                <Row style={{ justifyContent: "space-between" }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <AppText bold size={14}>{s.name}</AppText>
                    <AppText muted size={12}>
                      {[s.dose, s.timing].filter(Boolean).join(" · ")}
                    </AppText>
                  </View>
                  <Ionicons
                    name={isTaken ? "checkmark-circle" : "ellipse-outline"}
                    size={26}
                    color={isTaken ? theme.colors.accent : theme.colors.muted}
                  />
                </Row>
              </Card>
            </Pressable>
          );
        })}

        {due.length === 0 ? (
          <Card><AppText muted>Nothing due today.</AppText></Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
