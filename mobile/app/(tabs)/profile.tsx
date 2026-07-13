import React, { useState } from "react";
import { ScrollView, View, Alert, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { router } from "expo-router";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { WORKOUT_DAY_GOALS, REST_DAY_GOALS } from "@shared/types";
import { api } from "@/api/client";
import { API_BASE_URL } from "@/lib/config";
import { getAccessCode } from "@/lib/auth";
import { imageUrl } from "@/lib/images";
import { useProfile } from "@/api/queries";
import { useAuth } from "@/lib/AuthContext";
import { Card, AppText, ScreenTitle, Row, Pill, Button } from "@/components/ui";
import { RemindersCard } from "@/components/RemindersCard";
import { theme } from "@/lib/theme";
import { ACCESS_CODE_HEADER } from "@shared/access";

export default function Profile() {
  const { role, canWrite, signOut } = useAuth();
  const profile = useProfile();
  const [exporting, setExporting] = useState(false);
  const p = profile.data;

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={profile.isFetching} onRefresh={() => profile.refetch()} tintColor={theme.colors.accent} />}
      >
        <ScreenTitle title="You" subtitle="Profile · reminders · export" />

        <View style={{ marginBottom: 16 }}>
          <RemindersCard />
        </View>

        <Card style={{ alignItems: "center", marginBottom: 16 }}>
          <Image
            source={{ uri: imageUrl(p?.avatar_filename) ?? undefined }}
            style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: theme.colors.cardBorder, marginBottom: 10 }}
            contentFit="cover"
          />
          <AppText bold size={20}>{p?.name ?? "Rodrigues"}</AppText>
          <Row style={{ gap: 8, marginTop: 6 }}>
            {p?.age ? <Pill label={`${p.age} yr`} color={theme.colors.muted} /> : null}
            {p?.height ? <Pill label={p.height} color={theme.colors.muted} /> : null}
            <Pill label={role === "rodrigues" ? "Rodrigues" : "Guest"} />
          </Row>
          {p?.goal ? <AppText muted size={13} style={{ marginTop: 10, textAlign: "center" }}>{p.goal}</AppText> : null}
        </Card>

        <Card style={{ marginBottom: 16 }}>
          <AppText bold style={{ marginBottom: 10 }}>Macro targets</AppText>
          <Row style={{ justifyContent: "space-between", paddingVertical: 6 }}>
            <AppText muted size={13}>Training day</AppText>
            <AppText size={13} bold>{WORKOUT_DAY_GOALS.calories} kcal · {WORKOUT_DAY_GOALS.protein}P / {WORKOUT_DAY_GOALS.carbs}C / {WORKOUT_DAY_GOALS.fat}F</AppText>
          </Row>
          <Row style={{ justifyContent: "space-between", paddingVertical: 6, borderTopWidth: 1, borderTopColor: theme.colors.cardBorder }}>
            <AppText muted size={13}>Rest day</AppText>
            <AppText size={13} bold>{REST_DAY_GOALS.calories} kcal · {REST_DAY_GOALS.protein}P / {REST_DAY_GOALS.carbs}C / {REST_DAY_GOALS.fat}F</AppText>
          </Row>
        </Card>

        <Card style={{ marginBottom: 16 }}>
          <AppText bold style={{ marginBottom: 4 }}>Export data</AppText>
          <AppText muted size={13} style={{ marginBottom: 12 }}>
            Download everything — meals, body, workouts, supplements, program — as a JSON file you can save or share.
          </AppText>
          <Button label={exporting ? "Preparing…" : "Export all data"} loading={exporting} onPress={exportData} />
        </Card>

        <Card style={{ marginBottom: 16 }}>
          <AppText muted size={12}>Connected to</AppText>
          <AppText size={13}>{API_BASE_URL}</AppText>
          <AppText muted size={12} style={{ marginTop: 8 }}>Write access</AppText>
          <AppText size={13} color={canWrite ? theme.colors.accent : theme.colors.accentWarm}>
            {canWrite ? "Enabled" : "Read-only (Guest)"}
          </AppText>
        </Card>

        <Button label="Sign out" variant="danger" onPress={confirmSignOut} />
      </ScrollView>
    </SafeAreaView>
  );
}
