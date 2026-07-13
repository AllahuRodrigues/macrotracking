import React, { useEffect, useState } from "react";
import { View, TextInput, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { todayISO } from "@shared/timezone";
import type { DailyCheckin } from "@shared/types";
import { api } from "@/api/client";
import { openAppleHealth } from "@/lib/health";
import { Card, AppText, Row, Button, Pill } from "@/components/ui";
import { theme } from "@/lib/theme";

type Props = { date?: string; compact?: boolean };

export function CheckinCard({ date = todayISO(), compact }: Props) {
  const [c, setC] = useState<DailyCheckin>({ date });
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(!compact);

  useEffect(() => {
    api.getCheckin(date).then((d) => setC({ ...d, date })).catch(() => {});
  }, [date]);

  const save = async (patch: Partial<DailyCheckin>) => {
    const next = { ...c, ...patch, date };
    setC(next);
    setSaving(true);
    try {
      const saved = await api.saveCheckin(next);
      setC(saved);
      Haptics.selectionAsync();
    } catch (e) {
      Alert.alert("Could not save", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const input = {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.cardBorder,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    color: theme.colors.foreground,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    flex: 1,
  } as const;

  return (
    <Card>
      <Pressable onPress={() => setOpen((o) => !o)}>
        <Row style={{ justifyContent: "space-between" }}>
          <Row style={{ gap: 8 }}>
            <Ionicons name="moon" size={18} color={theme.colors.blue} />
            <AppText bold size={15}>Today's check-in</AppText>
          </Row>
          <Row style={{ gap: 6 }}>
            {c.steps != null ? <Pill label={`${c.steps.toLocaleString()} steps`} color={theme.colors.accent} /> : null}
            {c.sleep_hours != null ? <Pill label={`${c.sleep_hours}h sleep`} color={theme.colors.blue} /> : null}
            <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={theme.colors.muted} />
          </Row>
        </Row>
      </Pressable>

      {open ? (
        <View style={{ marginTop: 12, gap: 10 }}>
          <Row style={{ gap: 8 }}>
            <Field label="Sleep (h)">
              <TextInput
                style={input}
                keyboardType="decimal-pad"
                placeholder="7.5"
                placeholderTextColor={theme.colors.muted}
                value={c.sleep_hours != null ? String(c.sleep_hours) : ""}
                onChangeText={(t) => setC({ ...c, sleep_hours: t ? parseFloat(t) : null })}
                onEndEditing={() => save({ sleep_hours: c.sleep_hours })}
              />
            </Field>
            <Field label="Sleep 1–5">
              <ScoreRow
                value={c.sleep_quality ?? 0}
                max={5}
                onChange={(n) => save({ sleep_quality: n })}
              />
            </Field>
          </Row>

          <Field label="Steps">
            <Row style={{ gap: 8 }}>
              <TextInput
                style={input}
                keyboardType="number-pad"
                placeholder="12000"
                placeholderTextColor={theme.colors.muted}
                value={c.steps != null ? String(c.steps) : ""}
                onChangeText={(t) => setC({ ...c, steps: t ? parseInt(t, 10) : null })}
                onEndEditing={() => save({ steps: c.steps })}
              />
              {[10000, 12000, 14000].map((n) => (
                <Pressable
                  key={n}
                  onPress={() => save({ steps: n })}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 8,
                    borderRadius: theme.radius.sm,
                    backgroundColor: `${theme.colors.accent}22`,
                  }}
                >
                  <AppText size={11} color={theme.colors.accent} bold>
                    {(n / 1000).toFixed(0)}k
                  </AppText>
                </Pressable>
              ))}
            </Row>
          </Field>

          <Row style={{ gap: 8 }}>
            <Field label="Hunger 1–10">
              <ScoreRow value={c.hunger ?? 0} max={10} onChange={(n) => save({ hunger: n })} />
            </Field>
            <Field label="Stress 1–10">
              <ScoreRow value={c.stress ?? 0} max={10} onChange={(n) => save({ stress: n })} />
            </Field>
          </Row>

          <Row style={{ gap: 8 }}>
            <Field label="Bloat 1–10">
              <ScoreRow value={c.bloating ?? 0} max={10} onChange={(n) => save({ bloating: n })} />
            </Field>
            <Field label="Soreness 1–10">
              <ScoreRow value={c.soreness ?? 0} max={10} onChange={(n) => save({ soreness: n })} />
            </Field>
          </Row>

          <Row style={{ gap: 8 }}>
            <Field label="Resting HR">
              <TextInput
                style={input}
                keyboardType="number-pad"
                placeholder="58"
                placeholderTextColor={theme.colors.muted}
                value={c.resting_hr != null ? String(c.resting_hr) : ""}
                onChangeText={(t) => setC({ ...c, resting_hr: t ? parseInt(t, 10) : null })}
                onEndEditing={() => save({ resting_hr: c.resting_hr })}
              />
            </Field>
            <Field label="Session RPE">
              <ScoreRow value={c.session_rpe ?? 0} max={10} onChange={(n) => save({ session_rpe: n })} />
            </Field>
          </Row>

          <AppText muted size={11}>
            {saving ? "Saving…" : "Autosaves. Tap scores or type values."}
          </AppText>
          <Button
            label="Open Apple Health"
            variant="ghost"
            onPress={() => openAppleHealth()}
          />
        </View>
      ) : null}
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, gap: 4 }}>
      <AppText muted size={11}>{label}</AppText>
      {children}
    </View>
  );
}

function ScoreRow({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (n: number) => void;
}) {
  // Compact: show − / value / +
  return (
    <Row style={{ gap: 6 }}>
      <Pressable
        onPress={() => onChange(Math.max(1, (value || 1) - 1))}
        hitSlop={8}
        style={{ padding: 6 }}
      >
        <Ionicons name="remove-circle" size={22} color={theme.colors.muted} />
      </Pressable>
      <AppText bold size={16} style={{ minWidth: 28, textAlign: "center" }}>
        {value || "—"}
      </AppText>
      <Pressable
        onPress={() => onChange(Math.min(max, (value || 0) + 1))}
        hitSlop={8}
        style={{ padding: 6 }}
      >
        <Ionicons name="add-circle" size={22} color={theme.colors.accent} />
      </Pressable>
    </Row>
  );
}
