import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card, AppText, Row, Pill } from "@/components/ui";
import { theme } from "@/lib/theme";
import type { InsightsPayload } from "@shared/insights";

const GRADE_COLOR: Record<string, string> = {
  A: theme.colors.accent,
  B: "#86efac",
  C: theme.colors.accentWarm,
  D: "#fb923c",
  F: theme.colors.red,
};

export function InsightsHero({ data }: { data: InsightsPayload }) {
  const { execution, weight, adherence, coaching } = data;
  const top = coaching[0];

  return (
    <Card style={{ borderColor: `${theme.colors.accent}44` }}>
      <Row style={{ justifyContent: "space-between", marginBottom: 10 }}>
        <View>
          <AppText muted size={11} style={{ textTransform: "uppercase", letterSpacing: 1 }}>
            Execution Score
          </AppText>
          <Row style={{ alignItems: "baseline", gap: 8, marginTop: 2 }}>
            <AppText bold size={36} color={GRADE_COLOR[execution.grade] ?? theme.colors.accent}>
              {execution.total}
            </AppText>
            <Pill label={execution.grade} color={GRADE_COLOR[execution.grade]} />
          </Row>
          <AppText muted size={12}>{execution.label}</AppText>
        </View>
        {weight.ewma != null && (
          <View style={{ alignItems: "flex-end" }}>
            <AppText muted size={11}>Trend weight</AppText>
            <AppText bold size={22}>{weight.ewma} lb</AppText>
            {weight.weekly_rate_lbs != null && (
              <AppText
                size={12}
                color={weight.weekly_rate_lbs < 0 ? theme.colors.accent : theme.colors.red}
              >
                {weight.weekly_rate_lbs > 0 ? "+" : ""}
                {weight.weekly_rate_lbs.toFixed(2)}/wk
              </AppText>
            )}
          </View>
        )}
      </Row>

      <Row style={{ gap: 6, flexWrap: "wrap", marginBottom: top ? 12 : 0 }}>
        <MiniStat label="Cal hit" value={`${adherence.calorie_hit_rate_pct}%`} />
        <MiniStat label="Protein" value={`${adherence.protein_hit_rate_pct}%`} />
        <MiniStat label="Streak" value={`${adherence.streak_days}d`} />
        <MiniStat label="Avg cal" value={`${adherence.avg_calories}`} />
      </Row>

      {top ? (
        <View
          style={{
            backgroundColor: `${theme.colors.accentWarm}14`,
            borderRadius: theme.radius.md,
            padding: 12,
            borderLeftWidth: 3,
            borderLeftColor: theme.colors.accentWarm,
          }}
        >
          <AppText bold size={14}>{top.headline}</AppText>
          <AppText muted size={12} style={{ marginTop: 4, lineHeight: 18 }}>
            {top.body}
          </AppText>
        </View>
      ) : null}
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        backgroundColor: theme.colors.background,
        borderRadius: theme.radius.sm,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: theme.colors.cardBorder,
      }}
    >
      <AppText muted size={10}>{label}</AppText>
      <AppText bold size={13}>{value}</AppText>
    </View>
  );
}

export function InsightsDetail({ data }: { data: InsightsPayload }) {
  const { weight, adherence, tdee, coaching, anomalies, goal } = data;

  return (
    <View style={{ gap: 12 }}>
      {weight.latest_raw != null && (
        <Card>
          <AppText bold size={14} style={{ marginBottom: 8 }}>
            Weight engine
          </AppText>
          <StatRow label="Scale today" value={`${weight.latest_raw} lb`} />
          <StatRow label="7-day avg" value={weight.rolling_7d != null ? `${weight.rolling_7d} lb` : "—"} />
          <StatRow label="EWMA trend" value={weight.ewma != null ? `${weight.ewma} lb` : "—"} />
          <StatRow
            label="Noise vs trend"
            value={
              weight.noise_vs_trend != null
                ? `${weight.noise_vs_trend > 0 ? "+" : ""}${weight.noise_vs_trend} lb`
                : "—"
            }
          />
          <StatRow label="Confidence" value={weight.confidence} />
        </Card>
      )}

      <Card>
        <AppText bold size={14} style={{ marginBottom: 8 }}>
          Adherence
        </AppText>
        <StatRow label="Days logged" value={`${adherence.days_logged}/${adherence.days_in_window}`} />
        <StatRow label="Calorie variance" value={`±${adherence.calorie_std_dev} kcal`} />
        <StatRow label="Avg overshoot" value={`${adherence.avg_overshoot > 0 ? "+" : ""}${adherence.avg_overshoot} kcal`} />
        <StatRow label="Fat overshoot days" value={`${adherence.fat_overshoot_rate_pct}%`} />
        {adherence.weekend_avg_calories != null && (
          <StatRow
            label="Weekend vs weekday"
            value={`${adherence.weekend_avg_calories} vs ${adherence.weekday_avg_calories} kcal`}
          />
        )}
      </Card>

      {tdee.maintenance_kcal != null && (
        <Card>
          <AppText bold size={14} style={{ marginBottom: 8 }}>
            Adaptive TDEE
          </AppText>
          <StatRow label="Est. maintenance" value={`~${tdee.maintenance_kcal} kcal`} />
          {tdee.realized_deficit != null && (
            <StatRow label="Realized deficit" value={`~${tdee.realized_deficit} kcal/day`} />
          )}
          <StatRow label="Data quality" value={`${tdee.data_quality}/100`} />
        </Card>
      )}

      {goal.predicted_range_30d && (
        <Card>
          <AppText bold size={14} style={{ marginBottom: 8 }}>
            30-day forecast
          </AppText>
          <StatRow
            label="Predicted weight"
            value={`${goal.predicted_range_30d[0]}–${goal.predicted_range_30d[1]} lb`}
          />
          {goal.reach_goal_probability_pct != null && (
            <StatRow label={`Reach ${goal.target_lbs} lb`} value={`~${goal.reach_goal_probability_pct}%`} />
          )}
        </Card>
      )}

      {coaching.length > 1 && (
        <Card>
          <AppText bold size={14} style={{ marginBottom: 8 }}>
            What to change today
          </AppText>
          {coaching.slice(1).map((c, i) => (
            <View key={i} style={{ marginBottom: 10 }}>
              <Row style={{ gap: 6 }}>
                <Ionicons
                  name={c.priority === "high" ? "alert-circle" : "information-circle"}
                  size={16}
                  color={c.priority === "high" ? theme.colors.accentWarm : theme.colors.blue}
                />
                <AppText bold size={13} style={{ flex: 1 }}>
                  {c.headline}
                </AppText>
              </Row>
              <AppText muted size={12} style={{ marginLeft: 22, marginTop: 2, lineHeight: 18 }}>
                {c.body}
              </AppText>
            </View>
          ))}
        </Card>
      )}

      {anomalies.length > 0 && (
        <Card style={{ borderColor: `${theme.colors.accentWarm}55` }}>
          <AppText bold size={14} style={{ marginBottom: 8 }}>
            Data checks
          </AppText>
          {anomalies.map((a, i) => (
            <AppText key={i} muted size={12} style={{ marginBottom: 4 }}>
              • {a.message}
            </AppText>
          ))}
        </Card>
      )}
    </View>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <Row style={{ justifyContent: "space-between", paddingVertical: 4 }}>
      <AppText muted size={13}>{label}</AppText>
      <AppText size={13} bold>
        {value}
      </AppText>
    </Row>
  );
}
