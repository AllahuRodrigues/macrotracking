import React, { useState } from "react";
import { ScrollView, View, RefreshControl, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { todayISO, weekdayIndexISO } from "@shared/timezone";
import { WORKOUT_DAY_GOALS, REST_DAY_GOALS, WATER_GOAL_ML } from "@shared/types";
import { useDaySummary, useWater, useAddWater, useTodaySession, useInsights, useTips } from "@/api/queries";
import { DateNav } from "@/components/DateNav";
import { MacroRing, MacroBar } from "@/components/MacroRing";
import { InsightsHero } from "@/components/InsightsCard";
import { CheckinCard } from "@/components/CheckinCard";
import { MealRiskCard, WeeklyReportCard } from "@/components/MealRiskCard";
import { QuickLogBar } from "@/components/QuickLog";
import { TipsTodayCard } from "@/components/TipsTodayCard";
import { Card, AppText, Pill, Row } from "@/components/ui";
import { AnimatedCounter, PressableScale } from "@/components/anim";
import { theme } from "@/lib/theme";
import { api } from "@/api/client";

type DayType = "workout" | "rest";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const router = useRouter();
  const [date, setDate] = useState(todayISO());
  const isSunday = weekdayIndexISO(date) === 0;
  const [dayType, setDayType] = useState<DayType>(isSunday ? "rest" : "workout");
  const goals = dayType === "rest" ? REST_DAY_GOALS : WORKOUT_DAY_GOALS;

  const summary = useDaySummary(date);
  const water = useWater(date);
  const session = useTodaySession(date);
  const insights = useInsights(60);
  const tips = useTips(date);
  const report = useQuery({
    queryKey: ["report", date],
    queryFn: () => api.getReport(date),
  });
  const addWater = useAddWater(date);
  const qc = useQueryClient();

  const s = summary.data;
  const waterMl = water.data?.total_ml ?? 0;
  const waterPct = Math.min(100, Math.round((waterMl / WATER_GOAL_ML) * 100));
  const remaining = Math.max(0, goals.calories - (s?.calories ?? 0));

  const refreshing = summary.isFetching || water.isFetching || tips.isFetching;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => qc.invalidateQueries()} tintColor={theme.colors.accent} />
        }
      >
        {/* Gradient hero */}
        <LinearGradient
          colors={["#12241b", "#0b0f0e"]}
          style={{ paddingTop: 64, paddingBottom: 24, paddingHorizontal: 16 }}
        >
          <SafeAreaView edges={["top"]}>
            <Animated.View entering={FadeIn.duration(500)}>
              <AppText muted size={13}>{greeting()}, Rodrigues</AppText>
              <Row style={{ alignItems: "baseline", gap: 8, marginTop: 4 }}>
                <AnimatedCounter
                  value={remaining}
                  style={{ color: theme.colors.accent, fontSize: 44, fontWeight: "900", letterSpacing: -1 }}
                />
                <AppText muted size={15}>kcal left</AppText>
              </Row>
              <AppText muted size={12}>{Math.round(s?.calories ?? 0)} eaten · {goals.calories} goal</AppText>
            </Animated.View>
          </SafeAreaView>
        </LinearGradient>

        <View style={{ padding: 16 }}>
          <DateNav date={date} onChange={setDate} />

          {insights.data ? (
            <Animated.View entering={FadeInDown.delay(20).springify()} style={{ marginBottom: 14 }}>
              <InsightsHero data={insights.data} />
            </Animated.View>
          ) : null}

          {tips.data ? (
            <Animated.View entering={FadeInDown.delay(25).springify()} style={{ marginBottom: 14 }}>
              <TipsTodayCard data={tips.data} />
            </Animated.View>
          ) : null}

          {report.data?.meal_risk ? (
            <Animated.View entering={FadeInDown.delay(30).springify()} style={{ marginBottom: 14 }}>
              <MealRiskCard data={report.data.meal_risk} />
            </Animated.View>
          ) : null}

          <Animated.View entering={FadeInDown.delay(35).springify()} style={{ marginBottom: 14 }}>
            <QuickLogBar date={date} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(40).springify()} style={{ marginBottom: 14 }}>
            <CheckinCard date={date} compact />
          </Animated.View>

          {/* AI scan quick action */}
          <Animated.View entering={FadeInDown.delay(40).springify()}>
            <PressableScale onPress={() => router.push({ pathname: "/ai-scan", params: { date } })} style={{ marginBottom: 16 }}>
              <LinearGradient
                colors={[theme.colors.accentWarm, "#b45309"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: theme.radius.lg, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <Ionicons name="sparkles" size={26} color="#1a0e02" />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#1a0e02", fontWeight: "900", fontSize: 16 }}>Scan a meal with AI</Text>
                  <Text style={{ color: "#1a0e02cc", fontSize: 12 }}>Snap a photo → instant macros → one-tap log</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#1a0e02" />
              </LinearGradient>
            </PressableScale>
          </Animated.View>

          {/* Day type toggle */}
          <Row style={{ gap: 8, marginBottom: 16 }}>
            {(["workout", "rest"] as DayType[]).map((t) => (
              <PressableScale key={t} onPress={() => setDayType(t)} style={{ flex: 1 }}>
                <View
                  style={{
                    paddingVertical: 12,
                    borderRadius: theme.radius.md,
                    alignItems: "center",
                    backgroundColor: dayType === t ? theme.colors.accent : theme.colors.card,
                    borderWidth: 1,
                    borderColor: theme.colors.cardBorder,
                  }}
                >
                  <Text style={{ color: dayType === t ? "#04140b" : theme.colors.muted, fontWeight: "700" }}>
                    {t === "workout" ? "Training day" : "Rest day"}
                  </Text>
                  <Text style={{ color: dayType === t ? "#04140b" : theme.colors.muted, fontSize: 11 }}>
                    {t === "workout" ? WORKOUT_DAY_GOALS.calories : REST_DAY_GOALS.calories} kcal
                  </Text>
                </View>
              </PressableScale>
            ))}
          </Row>

          {/* Rings row */}
          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <Card style={{ marginBottom: 16 }}>
              <Row style={{ justifyContent: "space-around" }}>
                <MacroRing value={s?.calories ?? 0} goal={goals.calories} label="Calories" color={theme.colors.calories} size={120} stroke={11} delay={100} />
                <View style={{ justifyContent: "center", gap: 10 }}>
                  <MiniStat label="Protein" value={s?.protein ?? 0} goal={goals.protein} color={theme.colors.protein} />
                  <MiniStat label="Carbs" value={s?.carbs ?? 0} goal={goals.carbs} color={theme.colors.carbs} />
                  <MiniStat label="Fat" value={s?.fat ?? 0} goal={goals.fat} color={theme.colors.fat} />
                </View>
              </Row>
              <Row style={{ gap: 8, marginTop: 12, justifyContent: "center" }}>
                {s?.from_supplements ? <Pill label={`+${Math.round(s.from_supplements)} from supps`} /> : null}
                <Pill label={`${s?.entry_count ?? 0} items`} color={theme.colors.muted} />
              </Row>
            </Card>
          </Animated.View>

          {/* Macro bars */}
          <Animated.View entering={FadeInDown.delay(160).springify()}>
            <Card style={{ marginBottom: 16 }}>
              <MacroBar value={s?.protein ?? 0} goal={goals.protein} label="Protein" color={theme.colors.protein} delay={200} />
              <MacroBar value={s?.carbs ?? 0} goal={goals.carbs} label="Carbs" color={theme.colors.carbs} delay={300} />
              <MacroBar value={s?.fat ?? 0} goal={goals.fat} label="Fat" color={theme.colors.fat} delay={400} />
            </Card>
          </Animated.View>

          {/* Water */}
          <Animated.View entering={FadeInDown.delay(240).springify()}>
            <Card style={{ marginBottom: 16 }}>
              <Row style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <Row style={{ gap: 6 }}>
                  <AppText bold>Water</AppText>
                  <AppText muted size={13}>{(waterMl / 1000).toFixed(2)}L / 4L</AppText>
                </Row>
                <AppText color={theme.colors.blue} bold size={13}>{waterPct}%</AppText>
              </Row>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: theme.colors.cardBorder, overflow: "hidden", marginBottom: 12 }}>
                <View style={{ width: `${waterPct}%`, height: "100%", backgroundColor: theme.colors.blue }} />
              </View>
              <Row style={{ gap: 8 }}>
                {[250, 500, 750, 1000].map((ml) => (
                  <PressableScale key={ml} onPress={() => addWater.mutate(ml)} style={{ flex: 1 }}>
                    <View
                      style={{
                        paddingVertical: 10,
                        borderRadius: theme.radius.sm,
                        alignItems: "center",
                        backgroundColor: `${theme.colors.blue}18`,
                        borderWidth: 1,
                        borderColor: `${theme.colors.blue}33`,
                      }}
                    >
                      <Text style={{ color: theme.colors.blue, fontWeight: "700", fontSize: 12 }}>
                        +{ml >= 1000 ? `${ml / 1000}L` : `${ml}ml`}
                      </Text>
                    </View>
                  </PressableScale>
                ))}
              </Row>
            </Card>
          </Animated.View>

          {/* Today's workout */}
          <Animated.View entering={FadeInDown.delay(320).springify()}>
            <Card>
              <AppText bold size={16} style={{ marginBottom: 4 }}>
                {session.data?.session?.name ?? "Today's Workout"}
              </AppText>
              {session.data?.exercises?.length ? (
                <AppText muted size={13}>{session.data.exercises.length} exercises · tap Train to log sets</AppText>
              ) : (
                <AppText muted size={13}>Open Train → Start session to log weight × reps.</AppText>
              )}
            </Card>
          </Animated.View>

          {report.data?.weekly_report ? (
            <Animated.View entering={FadeInDown.delay(360).springify()} style={{ marginTop: 14 }}>
              <WeeklyReportCard data={report.data.weekly_report} />
            </Animated.View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function MiniStat({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  return (
    <View style={{ minWidth: 96 }}>
      <Row style={{ justifyContent: "space-between" }}>
        <Text style={{ color, fontSize: 12, fontWeight: "700" }}>{label}</Text>
        <Text style={{ color: theme.colors.muted, fontSize: 11 }}>{pct}%</Text>
      </Row>
      <Row style={{ alignItems: "baseline", gap: 2 }}>
        <AnimatedCounter value={value} style={{ color: theme.colors.foreground, fontSize: 18, fontWeight: "800" }} />
        <Text style={{ color: theme.colors.muted, fontSize: 11 }}>/ {Math.round(goal)}g</Text>
      </Row>
    </View>
  );
}
