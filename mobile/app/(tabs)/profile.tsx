import React, { useState } from "react";
import { ScrollView, View, Alert, RefreshControl, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { router } from "expo-router";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import {
  PLAN_PHASES,
  PLAN_GOAL_WEIGHT_LBS,
  PLAN_GOAL_BF,
  PLAN_TITLE,
  planPhaseFor,
  planActiveDayCount,
  PLAN_ACTIVE_DAYS_TOTAL,
} from "@shared/plan";
import { todayISO } from "@shared/timezone";
import { WORKOUT_DAY_GOALS, REST_DAY_GOALS } from "@shared/types";
import { api } from "@/api/client";
import { API_BASE_URL } from "@/lib/config";
import { getAccessCode } from "@/lib/auth";
import { imageUrl } from "@/lib/images";
import { useProfile, useBody } from "@/api/queries";
import { useAuth } from "@/lib/AuthContext";
import { Card, AppText, ScreenTitle, Row, Pill, Button } from "@/components/ui";
import { RemindersCard } from "@/components/RemindersCard";
import { theme } from "@/lib/theme";
import { ACCESS_CODE_HEADER } from "@shared/access";

export default function Profile() {
  const { role, canWrite, signOut } = useAuth();
  const profile = useProfile();
  const body = useBody(1);
  const [exporting, setExporting] = useState(false);
  const p = profile.data;
  const latest = body.data?.[0];
  const iso = todayISO();
  const phase = planPhaseFor(iso);
  const activeDay = planActiveDayCount(iso);

  async function exportData() {
    setExporting(true);
    try {
      const code = await getAccessCode();
      const dest = `${FileSystem.cacheDirectory}macrotrack-export-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      const res = await FileSystem.downloadAsync(api.exportUrl(), dest, {
        headers: code ? { [ACCESS_CODE_HEADER]: code } : undefined,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(res.uri, {
          mimeType: "application/json",
          dialogTitle: "Export MacroTrack data",
          UTI: "public.json",
        });
      } else {
        Alert.alert("Saved", `Export saved to ${res.uri}`);
      }
    } catch (e) {
      Alert.alert("Export failed", String((e as Error).message));
    } finally {
      setExporting(false);
    }
  }

  function confirmSignOut() {
    Alert.alert("Sign out?", "You'll return to the access screen.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/gate");
        },
      },
    ]);
  }

  const refreshing = profile.isFetching || body.isFetching;
  const refetch = () => {
    profile.refetch();
    body.refetch();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor={theme.colors.accent} />
        }
      >
        <ScreenTitle title="You" subtitle="Profile · numbers · reminders" />

        <Card style={{ alignItems: "center", marginBottom: 14 }}>
          <Image
            source={{ uri: imageUrl(p?.avatar_filename) ?? undefined }}
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              backgroundColor: theme.colors.cardBorder,
              marginBottom: 12,
            }}
            contentFit="cover"
          />
          <AppText bold size={22}>
            {p?.name ?? "Rodrigues"}
          </AppText>
          <Row style={{ gap: 8, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {p?.age ? <Pill label={`${p.age} yr`} color={theme.colors.muted} /> : null}
            {p?.height ? <Pill label={p.height} color={theme.colors.muted} /> : null}
            <Pill label={role === "rodrigues" ? "Rodrigues" : "Guest"} />
          </Row>
          {p?.goal ? (
            <AppText size={13} color={theme.colors.accent} style={{ marginTop: 12, textAlign: "center", lineHeight: 18 }}>
              {p.goal}
            </AppText>
          ) : null}
          {p?.notes ? (
            <AppText muted size={12} style={{ marginTop: 10, textAlign: "center", lineHeight: 17 }}>
              {p.notes}
            </AppText>
          ) : null}
        </Card>

        <Row style={{ gap: 8, marginBottom: 14 }}>
          <StatBox label="Weight" value={latest?.weight_lbs != null ? String(latest.weight_lbs) : "—"} unit="lb" />
          <StatBox
            label="BF%"
            value={latest?.body_fat_pct != null ? String(latest.body_fat_pct) : "—"}
            unit="%"
          />
          <StatBox
            label="Muscle"
            value={latest?.muscle_mass_lbs != null ? String(latest.muscle_mass_lbs) : "86.9"}
            unit="lb"
          />
          <StatBox label="Goal" value={String(PLAN_GOAL_WEIGHT_LBS)} unit={PLAN_GOAL_BF} accent />
        </Row>

        <Card style={{ marginBottom: 14 }}>
          <AppText bold size={15} style={{ marginBottom: 4 }}>
            {PLAN_TITLE}
          </AppText>
          <AppText muted size={12} style={{ marginBottom: 10 }}>
            {phase?.rest
              ? "Reset — steps + sleep"
              : activeDay > 0
                ? `Active day ${activeDay} / ${PLAN_ACTIVE_DAYS_TOTAL}`
                : "Outside cut window"}
          </AppText>
          <Row style={{ gap: 6 }}>
            {PLAN_PHASES.map((ph) => (
              <View
                key={ph.id}
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: theme.radius.sm,
                  backgroundColor:
                    phase?.id === ph.id ? `${theme.colors.accent}20` : theme.colors.background,
                  borderWidth: 1,
                  borderColor:
                    phase?.id === ph.id ? `${theme.colors.accent}55` : theme.colors.cardBorder,
                }}
              >
                <AppText muted size={9} bold style={{ textTransform: "uppercase" }}>
                  {ph.label}
                </AppText>
                <AppText size={11} bold>
                  {ph.start.slice(5)}
                </AppText>
              </View>
            ))}
          </Row>
        </Card>

        <Card style={{ marginBottom: 14 }}>
          <AppText bold style={{ marginBottom: 10 }}>
            Macro targets
          </AppText>
          <Row style={{ justifyContent: "space-between", paddingVertical: 8 }}>
            <AppText muted size={13}>
              Train day
            </AppText>
            <AppText size={13} bold>
              {WORKOUT_DAY_GOALS.calories} · {WORKOUT_DAY_GOALS.protein}P / {WORKOUT_DAY_GOALS.carbs}C /{" "}
              {WORKOUT_DAY_GOALS.fat}F
            </AppText>
          </Row>
          <Row
            style={{
              justifyContent: "space-between",
              paddingVertical: 8,
              borderTopWidth: 1,
              borderTopColor: theme.colors.cardBorder,
            }}
          >
            <AppText muted size={13}>
              Rest day
            </AppText>
            <AppText size={13} bold>
              {REST_DAY_GOALS.calories} · {REST_DAY_GOALS.protein}P / {REST_DAY_GOALS.carbs}C /{" "}
              {REST_DAY_GOALS.fat}F
            </AppText>
          </Row>
        </Card>

        <Row style={{ gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <NavChip label="Body" onPress={() => router.push("/(tabs)/body")} />
          <NavChip label="Progress" onPress={() => router.push("/(tabs)/progress")} />
          <NavChip label="Plan" onPress={() => router.push("/(tabs)/plan")} />
          <NavChip label="Rituals" onPress={() => router.push("/(tabs)/rituals")} />
          <NavChip label="Supps" onPress={() => router.push("/(tabs)/supplements")} />
        </Row>

        <View style={{ marginBottom: 14 }}>
          <RemindersCard />
        </View>

        <Card style={{ marginBottom: 14 }}>
          <AppText bold style={{ marginBottom: 4 }}>
            Export data
          </AppText>
          <AppText muted size={13} style={{ marginBottom: 12 }}>
            Download meals, body, workouts, supplements, program as JSON.
          </AppText>
          <Button label={exporting ? "Preparing…" : "Export all data"} loading={exporting} onPress={exportData} />
        </Card>

        <Card style={{ marginBottom: 14 }}>
          <AppText muted size={12}>
            Connected to
          </AppText>
          <AppText size={12}>{API_BASE_URL}</AppText>
          <AppText muted size={12} style={{ marginTop: 8 }}>
            Write access
          </AppText>
          <AppText size={13} color={canWrite ? theme.colors.accent : theme.colors.accentWarm}>
            {canWrite ? "Enabled" : "Read-only (Guest)"}
          </AppText>
        </Card>

        <Button label="Sign out" variant="danger" onPress={confirmSignOut} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: boolean;
}) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 70,
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.cardBorder,
        borderWidth: 1,
        borderRadius: theme.radius.md,
        paddingVertical: 12,
        paddingHorizontal: 6,
        alignItems: "center",
      }}
    >
      <AppText muted size={10} bold style={{ textTransform: "uppercase" }}>
        {label}
      </AppText>
      <AppText bold size={20} color={accent ? theme.colors.accent : undefined} style={{ marginTop: 4 }}>
        {value}
      </AppText>
      {unit ? (
        <AppText muted size={10} style={{ marginTop: 2 }}>
          {unit}
        </AppText>
      ) : null}
    </View>
  );
}

function NavChip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        minHeight: 44,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: theme.radius.md,
        backgroundColor: `${theme.colors.accent}18`,
        borderWidth: 1,
        borderColor: `${theme.colors.accent}40`,
      }}
    >
      <AppText bold size={13} color={theme.colors.accent}>
        {label}
      </AppText>
    </Pressable>
  );
}
