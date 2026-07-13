import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, AppText, Row, Pill } from "@/components/ui";
import { theme } from "@/lib/theme";

export type MealRiskData = {
  level: "low" | "medium" | "high";
  remaining_kcal: number;
  probability_pct: number;
  headline: string;
  body: string;
  suggestions: string[];
};

export type WeeklyReportData = {
  week_label: string;
  avg_calories: number;
  avg_protein: number;
  calorie_hit_rate: number;
  protein_hit_rate: number;
  biggest_problem: string;
  wins: string[];
  next_week_focus: string[];
  estimated_weight_change_lbs: number | null;
};

const LEVEL_COLOR = {
  low: theme.colors.accent,
  medium: theme.colors.accentWarm,
  high: theme.colors.red,
};

export function MealRiskCard({ data }: { data: MealRiskData }) {
  const color = LEVEL_COLOR[data.level];
  return (
    <Card style={{ borderColor: `${color}66`, borderWidth: 1.5 }}>
      <Row style={{ gap: 8, marginBottom: 6 }}>
        <Ionicons
          name={data.level === "high" ? "warning" : "restaurant"}
          size={18}
          color={color}
        />
        <AppText bold size={14} style={{ flex: 1 }} color={color}>
          {data.headline}
        </AppText>
        <Pill label={`${data.probability_pct}% risk`} color={color} />
      </Row>
      <AppText muted size={12} style={{ lineHeight: 18, marginBottom: 8 }}>
        {data.body}
      </AppText>
      {data.suggestions.map((s, i) => (
        <AppText key={i} size={12} style={{ marginBottom: 4, paddingLeft: 4 }}>
          → {s}
        </AppText>
      ))}
    </Card>
  );
}

export function WeeklyReportCard({ data }: { data: WeeklyReportData }) {
  return (
    <Card>
      <Row style={{ gap: 8, marginBottom: 10 }}>
        <Ionicons name="newspaper" size={18} color={theme.colors.accent} />
        <AppText bold size={15}>Weekly report</AppText>
      </Row>
      <Row style={{ gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <Pill label={`Avg ${data.avg_calories} kcal`} />
        <Pill label={`${data.avg_protein}g P`} color={theme.colors.protein} />
        <Pill label={`Cal hit ${data.calorie_hit_rate}%`} color={theme.colors.accentWarm} />
        <Pill label={`Pro hit ${data.protein_hit_rate}%`} color={theme.colors.protein} />
      </Row>
      <AppText bold size={13} style={{ marginBottom: 4 }}>Biggest problem</AppText>
      <AppText muted size={12} style={{ lineHeight: 18, marginBottom: 10 }}>
        {data.biggest_problem}
      </AppText>
      <AppText bold size={13} style={{ marginBottom: 4 }}>Wins</AppText>
      {data.wins.map((w, i) => (
        <AppText key={i} size={12} color={theme.colors.accent} style={{ marginBottom: 2 }}>
          ✓ {w}
        </AppText>
      ))}
      <AppText bold size={13} style={{ marginTop: 10, marginBottom: 4 }}>
        Next week focus
      </AppText>
      {data.next_week_focus.map((f, i) => (
        <AppText key={i} muted size={12} style={{ marginBottom: 2 }}>
          {i + 1}. {f}
        </AppText>
      ))}
      {data.estimated_weight_change_lbs != null && (
        <AppText muted size={11} style={{ marginTop: 10 }}>
          Trend ≈ {data.estimated_weight_change_lbs > 0 ? "+" : ""}
          {data.estimated_weight_change_lbs.toFixed(2)} lb/week
        </AppText>
      )}
    </Card>
  );
}
