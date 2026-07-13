import React from "react";
import { ScrollView, View, Dimensions, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LineChart, BarChart, PieChart } from "react-native-gifted-charts";
import Animated, { FadeInDown } from "react-native-reanimated";
import { formatDateShort } from "@shared/timezone";
import { WORKOUT_DAY_GOALS } from "@shared/types";
import type { DailyMacroSummary, BodyMetric } from "@shared/types";
import { useTrends } from "@/api/queries";
import { Card, AppText, ScreenTitle, Row, Pill } from "@/components/ui";
import { AnimatedCounter } from "@/components/anim";
import { theme } from "@/lib/theme";

const CHART_W = Dimensions.get("window").width - 16 * 2 - 32;

function avg(nums: number[]): number {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

/** Consecutive days (ending most-recent) with at least one logged entry. */
function loggingStreak(macros: DailyMacroSummary[]): number {
  // macros come newest-first from the API
  let streak = 0;
  for (const m of macros) {
    if (m.entry_count > 0) streak++;
    else break;
  }
  return streak;
}

export default function Stats({ embedded = false }: { embedded?: boolean }) {
  const trends = useTrends(30);
  const macrosNewestFirst = trends.data?.macros ?? [];
  const macros = [...macrosNewestFirst].reverse(); // oldest→newest for charts
  const body = [...(trends.data?.body ?? [])].reverse();

  const logged = macros.filter((m) => m.entry_count > 0);
  const streak = loggingStreak(macrosNewestFirst);
  const adherence = macros.length ? Math.round((logged.length / macros.length) * 100) : 0;

  const avgCal = Math.round(avg(logged.map((m) => m.calories)));
  const avgProtein = Math.round(avg(logged.map((m) => m.protein)));

  // Week-over-week (last 7 logged vs previous 7 logged)
  const last7 = logged.slice(-7);
  const prev7 = logged.slice(-14, -7);
  const calDelta = Math.round(avg(last7.map((m) => m.calories)) - avg(prev7.map((m) => m.calories)));
  const proteinDelta = Math.round(avg(last7.map((m) => m.protein)) - avg(prev7.map((m) => m.protein)));

  // Macro calorie split (avg of logged days)
  const pAvg = avg(logged.map((m) => m.protein));
  const cAvg = avg(logged.map((m) => m.carbs));
  const fAvg = avg(logged.map((m) => m.fat));
  const pCal = pAvg * 4;
  const cCal = cAvg * 4;
  const fCal = fAvg * 9;
  const totalCal = pCal + cCal + fCal || 1;
  const pieData = [
    { value: pCal, color: theme.colors.protein, text: `${Math.round((pCal / totalCal) * 100)}%` },
    { value: cCal, color: theme.colors.carbs, text: `${Math.round((cCal / totalCal) * 100)}%` },
    { value: fCal, color: theme.colors.fat, text: `${Math.round((fCal / totalCal) * 100)}%` },
  ];

  const bestDay = [...logged].sort((a, b) => b.protein - a.protein)[0];

  const calData = macros.map((m, i) => ({
    value: Math.round(m.calories),
    label: i % 5 === 0 ? formatDateShort(m.date) : "",
  }));
  const proteinData = macros.map((m, i) => ({
    value: Math.round(m.protein),
    label: i % 5 === 0 ? formatDateShort(m.date) : "",
    frontColor: m.protein >= WORKOUT_DAY_GOALS.protein ? theme.colors.protein : `${theme.colors.protein}77`,
  }));
  const weightPts = body.filter((b) => b.weight_lbs != null);
  const weightData = weightPts.map((b, i) => ({
    value: b.weight_lbs as number,
    label: i % 3 === 0 ? formatDateShort(b.date) : "",
  }));

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={embedded ? [] : ["top"]}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={trends.isFetching} onRefresh={() => trends.refetch()} tintColor={theme.colors.accent} />}
      >
        {!embedded ? <ScreenTitle title="Stats" subtitle="Last 30 days" /> : (
          <AppText muted size={13} style={{ marginBottom: 10 }}>Last 30 days</AppText>
        )}

        {/* Hero stat tiles */}
        <Animated.View entering={FadeInDown.springify()}>
          <Row style={{ gap: 8, marginBottom: 8 }}>
            <StatTile label="Streak" value={streak} suffix="d" color={theme.colors.accent} />
            <StatTile label="Adherence" value={adherence} suffix="%" color={theme.colors.blue} />
          </Row>
          <Row style={{ gap: 8, marginBottom: 16 }}>
            <StatTile label="Avg calories" value={avgCal} color={theme.colors.calories} />
            <StatTile label="Avg protein" value={avgProtein} suffix="g" color={theme.colors.protein} />
          </Row>
        </Animated.View>

        {/* Week over week */}
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <Card style={{ marginBottom: 16 }}>
            <AppText bold style={{ marginBottom: 10 }}>This week vs last</AppText>
            <Row style={{ justifyContent: "space-between", paddingVertical: 4 }}>
              <AppText muted size={13}>Calories / day</AppText>
              <DeltaPill delta={calDelta} goodWhenNegative unit="" />
            </Row>
            <Row style={{ justifyContent: "space-between", paddingVertical: 4 }}>
              <AppText muted size={13}>Protein / day</AppText>
              <DeltaPill delta={proteinDelta} unit="g" />
            </Row>
          </Card>
        </Animated.View>

        {/* Macro split donut */}
        {totalCal > 1 ? (
          <Animated.View entering={FadeInDown.delay(160).springify()}>
            <Card style={{ marginBottom: 16 }}>
              <AppText bold style={{ marginBottom: 12 }}>Where your calories come from</AppText>
              <Row style={{ justifyContent: "space-around", alignItems: "center" }}>
                <PieChart
                  data={pieData}
                  donut
                  radius={70}
                  innerRadius={45}
                  innerCircleColor={theme.colors.card}
                  centerLabelComponent={() => (
                    <View style={{ alignItems: "center" }}>
                      <AppText bold size={16}>{Math.round(totalCal)}</AppText>
                      <AppText muted size={10}>kcal/day</AppText>
                    </View>
                  )}
                />
                <View style={{ gap: 8 }}>
                  <Legend color={theme.colors.protein} label="Protein" grams={pAvg} pct={(pCal / totalCal) * 100} />
                  <Legend color={theme.colors.carbs} label="Carbs" grams={cAvg} pct={(cCal / totalCal) * 100} />
                  <Legend color={theme.colors.fat} label="Fat" grams={fAvg} pct={(fCal / totalCal) * 100} />
                </View>
              </Row>
            </Card>
          </Animated.View>
        ) : null}

        {bestDay ? (
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Card style={{ marginBottom: 16, borderColor: `${theme.colors.accent}44` }}>
              <Row style={{ justifyContent: "space-between" }}>
                <View>
                  <AppText muted size={12}>Highest-protein day</AppText>
                  <AppText bold size={15}>{formatDateShort(bestDay.date)}</AppText>
                </View>
                <Pill label={`${Math.round(bestDay.protein)}g protein`} />
              </Row>
            </Card>
          </Animated.View>
        ) : null}

        {calData.length ? (
          <Animated.View entering={FadeInDown.delay(240).springify()}>
            <Card style={{ marginBottom: 16 }}>
              <Row style={{ justifyContent: "space-between", marginBottom: 12 }}>
                <AppText bold>Calories</AppText>
                <Pill label={`goal ${WORKOUT_DAY_GOALS.calories}`} />
              </Row>
              <LineChart
                data={calData}
                width={CHART_W}
                height={160}
                thickness={2}
                color={theme.colors.calories}
                hideDataPoints
                yAxisTextStyle={{ color: theme.colors.muted, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: theme.colors.muted, fontSize: 9 }}
                rulesColor={theme.colors.cardBorder}
                yAxisColor={theme.colors.cardBorder}
                xAxisColor={theme.colors.cardBorder}
              />
            </Card>
          </Animated.View>
        ) : null}

        {proteinData.length ? (
          <Animated.View entering={FadeInDown.delay(280).springify()}>
            <Card style={{ marginBottom: 16 }}>
              <AppText bold style={{ marginBottom: 12 }}>Protein (g) — bright = hit 200g</AppText>
              <BarChart
                data={proteinData}
                width={CHART_W}
                height={150}
                barWidth={6}
                spacing={4}
                noOfSections={4}
                yAxisTextStyle={{ color: theme.colors.muted, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: theme.colors.muted, fontSize: 9 }}
                rulesColor={theme.colors.cardBorder}
                yAxisColor={theme.colors.cardBorder}
                xAxisColor={theme.colors.cardBorder}
              />
            </Card>
          </Animated.View>
        ) : null}

        {weightData.length ? (
          <Animated.View entering={FadeInDown.delay(320).springify()}>
            <Card style={{ marginBottom: 16 }}>
              <Row style={{ justifyContent: "space-between", marginBottom: 12 }}>
                <AppText bold>Weight (lb)</AppText>
                <Pill label="goal 174" color={theme.colors.accentWarm} />
              </Row>
              <LineChart
                data={weightData}
                width={CHART_W}
                height={160}
                thickness={2}
                color={theme.colors.blue}
                dataPointsColor={theme.colors.blue}
                yAxisTextStyle={{ color: theme.colors.muted, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: theme.colors.muted, fontSize: 9 }}
                rulesColor={theme.colors.cardBorder}
                yAxisColor={theme.colors.cardBorder}
                xAxisColor={theme.colors.cardBorder}
                yAxisOffset={Math.max(0, Math.min(...weightData.map((d) => d.value)) - 5)}
              />
            </Card>
          </Animated.View>
        ) : null}

        {!calData.length && !weightData.length ? (
          <Card><AppText muted>No data yet. Log meals and body metrics to see trends.</AppText></Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatTile({ label, value, suffix = "", color }: { label: string; value: number; suffix?: string; color: string }) {
  return (
    <Card style={{ flex: 1, alignItems: "center", paddingVertical: 16 }}>
      <AppText muted size={11}>{label}</AppText>
      <Row style={{ alignItems: "baseline" }}>
        <AnimatedCounter value={value} suffix={suffix} style={{ color, fontSize: 26, fontWeight: "900" }} />
      </Row>
    </Card>
  );
}

function Legend({ color, label, grams, pct }: { color: string; label: string; grams: number; pct: number }) {
  return (
    <Row style={{ gap: 8, alignItems: "center" }}>
      <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: color }} />
      <View>
        <AppText size={13} bold>{label} · {Math.round(pct)}%</AppText>
        <AppText muted size={11}>{Math.round(grams)}g / day</AppText>
      </View>
    </Row>
  );
}

function DeltaPill({ delta, unit, goodWhenNegative }: { delta: number; unit: string; goodWhenNegative?: boolean }) {
  const isGood = goodWhenNegative ? delta <= 0 : delta >= 0;
  const color = delta === 0 ? theme.colors.muted : isGood ? theme.colors.accent : theme.colors.red;
  const arrow = delta > 0 ? "▲" : delta < 0 ? "▼" : "—";
  return (
    <Row style={{ gap: 4, alignItems: "center" }}>
      <AppText size={13} bold color={color}>{arrow} {Math.abs(delta)}{unit}</AppText>
    </Row>
  );
}
