import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TIP_DOMAIN_LABEL, type DailyTipsPayload } from "@shared/daily-tips";
import { Card, AppText, Row } from "@/components/ui";
import { theme } from "@/lib/theme";

const DOMAIN_COLOR: Record<string, string> = {
  skin: "#fbbf24",
  hair: "#c084fc",
  scent: "#22d3ee",
  circulation: "#fb7185",
  endurance: theme.colors.accent,
  speed: theme.colors.accentWarm,
  recovery: theme.colors.blue,
  habits: theme.colors.muted,
};

export function TipsTodayCard({ data }: { data: DailyTipsPayload }) {
  if (!data.tips.length) return null;

  return (
    <Card>
      <Row style={{ gap: 8, marginBottom: 4 }}>
        <Ionicons name="sparkles" size={20} color={theme.colors.accent} />
        <AppText bold size={17}>
          Tips for today
        </AppText>
      </Row>
      <AppText muted size={12} style={{ marginBottom: 4 }}>
        From your plan + macros + check-in — skin, scent, blood flow, endurance, speed, hair.
      </AppText>
      <AppText size={12} color={theme.colors.accent} style={{ marginBottom: 12 }}>
        {data.day_label.split("—")[0]?.trim()} · {data.focus}
      </AppText>

      {data.tips.map((tip, i) => (
        <View
          key={tip.id}
          style={{
            paddingVertical: 12,
            borderTopWidth: i === 0 ? 0 : 1,
            borderTopColor: theme.colors.cardBorder,
          }}
        >
          <Row style={{ gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <AppText muted size={11} bold>
              {i + 1}.
            </AppText>
            <View
              style={{
                backgroundColor: `${DOMAIN_COLOR[tip.domain] ?? theme.colors.muted}22`,
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}
            >
              <AppText size={10} bold color={DOMAIN_COLOR[tip.domain] ?? theme.colors.muted}>
                {TIP_DOMAIN_LABEL[tip.domain].toUpperCase()}
              </AppText>
            </View>
            {tip.priority === "high" ? (
              <AppText size={10} bold color={theme.colors.accentWarm}>
                PRIORITY
              </AppText>
            ) : null}
          </Row>
          <AppText bold size={14}>
            {tip.title}
          </AppText>
          <AppText size={13} style={{ marginTop: 4, lineHeight: 18 }}>
            {tip.action}
          </AppText>
          <AppText muted size={11} style={{ marginTop: 4, lineHeight: 15 }}>
            {tip.why}
          </AppText>
        </View>
      ))}
    </Card>
  );
}
