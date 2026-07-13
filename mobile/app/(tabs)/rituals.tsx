import React, { useEffect, useState, useCallback } from "react";
import { ScrollView, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { todayISO } from "@shared/timezone";
import {
  DAILY_RITUALS,
  RITUAL_CATEGORY_META,
  RITUAL_PLAYBOOK,
  GEAR_LIST,
  HARD_RULES,
  dailyRitualProgress,
  type RitualCategory,
} from "@shared/rituals";
import { Card, AppText, Row, ScreenTitle, Button } from "@/components/ui";
import { theme } from "@/lib/theme";

const STORAGE_KEY = "macro_rituals_v1";

type Store = Record<string, Record<string, boolean>>;
type Tab = "today" | "playbook" | "kit";

async function loadStore(): Promise<Store> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return {};
}

async function saveStore(store: Store) {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(store));
}

const CATS = (Object.keys(RITUAL_CATEGORY_META) as RitualCategory[]).filter((c) => c !== "kit");

export default function RitualsScreen() {
  const date = todayISO();
  const [tab, setTab] = useState<Tab>("today");
  const [done, setDone] = useState<Record<string, boolean>>({});

  const refresh = useCallback(async () => {
    const store = await loadStore();
    setDone(store[date] ?? {});
  }, [date]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = async (id: string) => {
    const store = await loadStore();
    const day = { ...(store[date] ?? {}) };
    day[id] = !day[id];
    store[date] = day;
    await saveStore(store);
    setDone(day);
    Haptics.selectionAsync();
  };

  const clearDay = async () => {
    const store = await loadStore();
    store[date] = {};
    await saveStore(store);
    setDone({});
  };

  const progress = dailyRitualProgress(done);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <ScreenTitle
          title="Rituals"
          subtitle="Look sharp · smell good · zero Zyns · muscle up"
        />

        <Row style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <AppText muted size={13}>
            Today · {progress.done}/{progress.total}
          </AppText>
          <AppText bold size={22} color={theme.colors.accent}>
            {progress.pct}%
          </AppText>
        </Row>

        <View
          style={{
            backgroundColor: `${theme.colors.red}22`,
            borderColor: `${theme.colors.red}55`,
            borderWidth: 1,
            borderRadius: theme.radius.md,
            padding: 12,
            marginBottom: 14,
          }}
        >
          <AppText bold size={14} color={theme.colors.red}>
            Hard rule — no Zyns
          </AppText>
          <AppText muted size={12} style={{ marginTop: 4 }}>
            Nicotine pouches are out. Craving → water, gum, walk. Protect gums, sleep, and the cut.
          </AppText>
        </View>

        <Row style={{ gap: 8, marginBottom: 14 }}>
          {(
            [
              ["today", "Today"],
              ["playbook", "Playbook"],
              ["kit", "Kit"],
            ] as const
          ).map(([key, label]) => (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              style={{
                flex: 1,
                minHeight: 44,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: theme.radius.md,
                backgroundColor: tab === key ? `${theme.colors.accent}22` : theme.colors.card,
                borderWidth: 1,
                borderColor: tab === key ? `${theme.colors.accent}55` : theme.colors.cardBorder,
              }}
            >
              <AppText bold size={13} color={tab === key ? theme.colors.accent : theme.colors.muted}>
                {label}
              </AppText>
            </Pressable>
          ))}
        </Row>

        {tab === "today" && (
          <Card>
            <Row style={{ justifyContent: "space-between", marginBottom: 10 }}>
              <AppText muted size={11} bold style={{ textTransform: "uppercase" }}>
                Daily checklist
              </AppText>
              <Pressable onPress={clearDay} hitSlop={8}>
                <AppText size={12} color={theme.colors.muted}>
                  Reset
                </AppText>
              </Pressable>
            </Row>
            {DAILY_RITUALS.map((r) => {
              const on = !!done[r.id];
              return (
                <Pressable
                  key={r.id}
                  onPress={() => toggle(r.id)}
                  style={{
                    flexDirection: "row",
                    gap: 12,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.cardBorder,
                    minHeight: 56,
                  }}
                >
                  <Ionicons
                    name={on ? "checkmark-circle" : "ellipse-outline"}
                    size={24}
                    color={on ? theme.colors.accent : theme.colors.muted}
                  />
                  <View style={{ flex: 1 }}>
                    <AppText bold size={14} color={on ? theme.colors.accent : undefined}>
                      {r.title}
                    </AppText>
                    <AppText muted size={12} style={{ marginTop: 2, lineHeight: 16 }}>
                      {r.detail}
                    </AppText>
                  </View>
                </Pressable>
              );
            })}
          </Card>
        )}

        {tab === "playbook" && (
          <View style={{ gap: 12 }}>
            {HARD_RULES.map((rule) => (
              <AppText key={rule} muted size={13} style={{ lineHeight: 18 }}>
                · {rule}
              </AppText>
            ))}
            {CATS.map((cat) => {
              const extras = RITUAL_PLAYBOOK.filter((r) => r.category === cat && !r.daily);
              return (
                <Card key={cat}>
                  <AppText bold size={15}>
                    {RITUAL_CATEGORY_META[cat].label}
                  </AppText>
                  <AppText muted size={12} style={{ marginTop: 4, marginBottom: 10 }}>
                    {RITUAL_CATEGORY_META[cat].blurb}
                  </AppText>
                  {extras.length === 0 ? (
                    <AppText muted size={12}>
                      Daily items live under Today.
                    </AppText>
                  ) : (
                    extras.map((r) => (
                      <View key={r.id} style={{ marginBottom: 10 }}>
                        <AppText bold size={13}>
                          {r.title}
                        </AppText>
                        <AppText muted size={12} style={{ marginTop: 2, lineHeight: 16 }}>
                          {r.detail}
                        </AppText>
                      </View>
                    ))
                  )}
                </Card>
              );
            })}
          </View>
        )}

        {tab === "kit" && (
          <Card>
            <AppText bold size={15} style={{ marginBottom: 4 }}>
              Things to have
            </AppText>
            <AppText muted size={12} style={{ marginBottom: 12 }}>
              {RITUAL_CATEGORY_META.kit.blurb}
            </AppText>
            {GEAR_LIST.map((g) => (
              <Row
                key={g.item}
                style={{
                  justifyContent: "space-between",
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.cardBorder,
                  gap: 8,
                }}
              >
                <AppText size={13} bold style={{ flex: 1 }}>
                  {g.item}
                </AppText>
                <AppText muted size={11}>
                  {g.why}
                </AppText>
              </Row>
            ))}
          </Card>
        )}

        <View style={{ height: 16 }} />
        <Button label="Phone reminder settings" onPress={() => router.push("/(tabs)/profile")} />
        <AppText muted size={11} style={{ marginTop: 8, textAlign: "center" }}>
          Enable “Rituals & glow” under You → Phone reminders for pop-ups.
        </AppText>
      </ScrollView>
    </SafeAreaView>
  );
}
