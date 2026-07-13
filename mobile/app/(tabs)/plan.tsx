import React, { useState } from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { todayISO } from "@shared/timezone";
import {
  PLAN_TITLE,
  PLAN_SUBTITLE,
  PLAN_ACTIVE_DAYS_TOTAL,
  PLAN_START_ISO,
  PLAN_END_ISO,
  PLAN_PHASES,
  PLAN_RULES,
  PLAN_EXTRAS,
  PLAN_WEEK,
  PLAN_PROGRESSION,
  PLAN_BOTTOM_LINE,
  SHAKE_PROTOCOL,
  TRAINING_DAY_TEMPLATE,
  REST_DAY_TEMPLATE,
  SUPPLEMENT_GUIDANCE,
  APPEARANCE_RULES,
  planDayFor,
  planWeekNumber,
  planPhaseFor,
  planActiveDayCount,
  type PlanDay,
} from "@shared/plan";
import { Card, AppText, Row, Pill, ScreenTitle } from "@/components/ui";
import { theme } from "@/lib/theme";

const VERDICT_COLOR: Record<string, string> = {
  keep: theme.colors.accent,
  optional: theme.colors.blue,
  review: theme.colors.accentWarm,
  avoid: theme.colors.red,
};

export default function Plan() {
  const weekday = new Date().getDay();
  const today = planDayFor(weekday);
  const iso = todayISO();
  const weekNo = planWeekNumber(iso);
  const phase = planPhaseFor(iso);
  const activeDay = planActiveDayCount(iso);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 14 }}>
        {/* Hero */}
        <LinearGradient
          colors={[theme.colors.accent, "#0f7a43"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: theme.radius.xl, padding: 18 }}
        >
          <Text style={{ color: "#04140b", fontSize: 22, fontWeight: "900", letterSpacing: -0.5 }}>
            {PLAN_TITLE}
          </Text>
          <Text style={{ color: "#04240fcc", fontSize: 13, marginTop: 4 }}>{PLAN_SUBTITLE}</Text>
          <Text style={{ color: "#04240faa", fontSize: 11, marginTop: 6, fontWeight: "600" }}>
            {PLAN_START_ISO} → {PLAN_END_ISO} · Reset Aug 1–2
          </Text>
          <Row style={{ gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <View style={{ backgroundColor: "#04140b22", borderRadius: theme.radius.md, paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ color: "#04140b", fontWeight: "800", fontSize: 15 }}>
                {phase?.rest
                  ? "Reset day"
                  : activeDay > 0
                    ? `Day ${activeDay} / ${PLAN_ACTIVE_DAYS_TOTAL}`
                    : "Outside window"}
              </Text>
            </View>
            {phase ? (
              <View style={{ backgroundColor: "#04140b22", borderRadius: theme.radius.md, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Text style={{ color: "#04140b", fontWeight: "800", fontSize: 15 }}>{phase.label}</Text>
              </View>
            ) : null}
            {weekNo > 0 ? (
              <View style={{ backgroundColor: "#04140b22", borderRadius: theme.radius.md, paddingHorizontal: 12, paddingVertical: 6 }}>
                <Text style={{ color: "#04140b", fontWeight: "800", fontSize: 15 }}>Week {weekNo}</Text>
              </View>
            ) : null}
          </Row>
        </LinearGradient>

        <Row style={{ gap: 8 }}>
          {PLAN_PHASES.map((p) => (
            <View
              key={p.id}
              style={{
                flex: 1,
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: phase?.id === p.id ? `${theme.colors.accent}66` : theme.colors.cardBorder,
                backgroundColor: phase?.id === p.id ? `${theme.colors.accent}18` : theme.colors.card,
                padding: 10,
              }}
            >
              <AppText muted size={10} bold style={{ textTransform: "uppercase" }}>
                {p.label}
              </AppText>
              <AppText size={12} bold style={{ marginTop: 2 }}>
                {p.start.slice(5)}→{p.end.slice(5)}
              </AppText>
            </View>
          ))}
        </Row>

        {/* Today's session */}
        <Card>
          <Row style={{ justifyContent: "space-between", marginBottom: 6 }}>
            <AppText bold size={12} muted style={{ textTransform: "uppercase" }}>Today</AppText>
            <Ionicons name="barbell" size={18} color={theme.colors.accent} />
          </Row>
          <AppText bold size={17}>{today.title}</AppText>
          <AppText muted size={13} style={{ marginTop: 2 }}>{today.focus}</AppText>
          {PLAN_EXTRAS.split ? (
            <AppText size={11} color={theme.colors.accent} style={{ marginTop: 6 }}>
              {PLAN_EXTRAS.split}
            </AppText>
          ) : null}
          <DayBlocks day={today} defaultOpen />
        </Card>

        {/* Bottom line */}
        <Card style={{ borderColor: `${theme.colors.accent}55` }}>
          <Row style={{ gap: 6, marginBottom: 6 }}>
            <Ionicons name="bulb" size={16} color={theme.colors.accent} />
            <AppText bold size={13}>The one-sentence version</AppText>
          </Row>
          <AppText size={13} style={{ lineHeight: 20 }}>{PLAN_BOTTOM_LINE}</AppText>
        </Card>

        {/* Non-negotiable rules */}
        <Section title="Non-negotiable daily rules" icon="checkmark-done">
          {PLAN_RULES.map((r, i) => (
            <BulletRow key={i} text={r} />
          ))}
          <View style={{ height: 8 }} />
          <Pill label={PLAN_EXTRAS.trainingHoursPerDay} color={theme.colors.accentWarm} />
          <View style={{ height: 6 }} />
          <Pill label={PLAN_EXTRAS.sauna} color={theme.colors.blue} />
          <AppText muted size={12} style={{ marginTop: 10, lineHeight: 18 }}>{PLAN_EXTRAS.asthmaNote}</AppText>
        </Section>

        {/* Nutrition */}
        <Section title="Training-day food" icon="restaurant" accent={theme.colors.accent}>
          <AppText muted size={12} style={{ marginBottom: 8 }}>{TRAINING_DAY_TEMPLATE.target}</AppText>
          {TRAINING_DAY_TEMPLATE.meals.map((m) => (
            <MealBlock key={m.slot} slot={m.slot} items={m.items} />
          ))}
        </Section>

        <Section title="Rest-day food" icon="moon" accent={theme.colors.blue}>
          <AppText muted size={12} style={{ marginBottom: 8 }}>{REST_DAY_TEMPLATE.target}</AppText>
          {REST_DAY_TEMPLATE.meals.map((m) => (
            <MealBlock key={m.slot} slot={m.slot} items={m.items} />
          ))}
        </Section>

        {/* Shake protocol */}
        <Section title={SHAKE_PROTOCOL.title} icon="nutrition" accent={theme.colors.protein}>
          <AppText bold size={13}>{SHAKE_PROTOCOL.perServing}</AppText>
          <AppText size={13} color={theme.colors.protein} style={{ marginTop: 4 }}>{SHAKE_PROTOCOL.daily}</AppText>
          <Row style={{ flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {SHAKE_PROTOCOL.timing.map((t, i) => (
              <Pill key={i} label={`${i + 1}. ${t}`} color={theme.colors.protein} />
            ))}
          </Row>
          <AppText muted size={12} style={{ marginTop: 10, lineHeight: 18 }}>{SHAKE_PROTOCOL.note}</AppText>
        </Section>

        {/* Supplements */}
        <Section title="Supplements" icon="medkit" accent={theme.colors.fat}>
          {SUPPLEMENT_GUIDANCE.map((s) => (
            <View key={s.name} style={{ marginBottom: 10 }}>
              <Row style={{ justifyContent: "space-between" }}>
                <AppText bold size={14} style={{ flex: 1, paddingRight: 8 }}>{s.name}</AppText>
                <Pill label={s.verdict} color={VERDICT_COLOR[s.verdict] ?? theme.colors.muted} />
              </Row>
              <AppText muted size={12} style={{ marginTop: 2 }}>{s.detail}</AppText>
            </View>
          ))}
        </Section>

        {/* Progression */}
        <Section title="3-week progression" icon="trending-up" accent={theme.colors.accentWarm}>
          {PLAN_PROGRESSION.map((p) => (
            <View key={p.week} style={{ marginBottom: 10 }}>
              <AppText bold size={14}>{p.week}</AppText>
              {p.points.map((pt, i) => (
                <BulletRow key={i} text={pt} />
              ))}
            </View>
          ))}
        </Section>

        {/* Appearance rules */}
        <Section title="Look-better rules" icon="eye" accent={theme.colors.blue}>
          {APPEARANCE_RULES.map((r, i) => (
            <BulletRow key={i} text={r} />
          ))}
        </Section>

        {/* Full week */}
        <ScreenTitle title="Full weekly split" />
        {[1, 2, 3, 4, 5, 6, 0].map((wd) => {
          const d = planDayFor(wd);
          return (
            <Card key={wd} style={{ marginBottom: 4 }}>
              <AppText bold size={15}>{d.title}</AppText>
              <AppText muted size={12} style={{ marginTop: 2 }}>{d.focus}</AppText>
              <DayBlocks day={d} />
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function DayBlocks({ day, defaultOpen = false }: { day: PlanDay; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={{ marginTop: 10 }}>
      <Pressable onPress={() => setOpen((o) => !o)}>
        <Row style={{ gap: 6 }}>
          <Ionicons name={open ? "chevron-down" : "chevron-forward"} size={16} color={theme.colors.accent} />
          <AppText size={13} color={theme.colors.accent}>{open ? "Hide exercises" : "Show exercises"}</AppText>
        </Row>
      </Pressable>
      {open ? (
        <View style={{ marginTop: 8 }}>
          {day.warmup ? <AppText muted size={12} style={{ marginBottom: 8, fontStyle: "italic" }}>Warm-up: {day.warmup}</AppText> : null}
          {day.blocks.map((b, bi) => (
            <View key={bi} style={{ marginBottom: 8 }}>
              {b.heading ? <AppText bold size={12} muted style={{ marginBottom: 4, textTransform: "uppercase" }}>{b.heading}</AppText> : null}
              {b.exercises.map((ex, ei) => (
                <Row key={ei} style={{ justifyContent: "space-between", paddingVertical: 3 }}>
                  <AppText size={13} style={{ flex: 1, paddingRight: 8 }}>{ex.name}</AppText>
                  <AppText size={13} color={theme.colors.accent} bold>{ex.scheme}</AppText>
                </Row>
              ))}
            </View>
          ))}
          {day.cardio ? (
            <Row style={{ gap: 6, marginTop: 4 }}>
              <Ionicons name="walk" size={14} color={theme.colors.accentWarm} />
              <AppText size={12} color={theme.colors.accentWarm} style={{ flex: 1 }}>{day.cardio}</AppText>
            </Row>
          ) : null}
          {day.coachNote ? <AppText muted size={12} style={{ marginTop: 6, lineHeight: 18 }}>{day.coachNote}</AppText> : null}
        </View>
      ) : null}
    </View>
  );
}

function Section({
  title,
  icon,
  accent = theme.colors.foreground,
  children,
}: {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <Row style={{ gap: 8, marginBottom: 10 }}>
        <Ionicons name={icon} size={18} color={accent} />
        <AppText bold size={16}>{title}</AppText>
      </Row>
      {children}
    </Card>
  );
}

function BulletRow({ text }: { text: string }) {
  return (
    <Row style={{ alignItems: "flex-start", gap: 8, paddingVertical: 3 }}>
      <Text style={{ color: theme.colors.accent, fontSize: 14, lineHeight: 20 }}>•</Text>
      <AppText size={13} style={{ flex: 1, lineHeight: 20 }}>{text}</AppText>
    </Row>
  );
}

function MealBlock({ slot, items }: { slot: string; items: string[] }) {
  return (
    <View style={{ marginBottom: 8 }}>
      <AppText bold size={13}>{slot}</AppText>
      {items.map((it, i) => (
        <AppText key={i} muted size={12} style={{ marginLeft: 8, marginTop: 2 }}>• {it}</AppText>
      ))}
    </View>
  );
}
