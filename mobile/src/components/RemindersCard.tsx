import React, { useEffect, useState } from "react";
import { Switch, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  loadPrefs,
  applyReminders,
  ensurePermission,
  sendWelcomeNotification,
  DEFAULT_PREFS,
  scheduledCount,
  isNotificationsAvailable,
  type ReminderPrefs,
} from "@/lib/reminders";
import { Card, AppText, Row, Button } from "@/components/ui";
import { theme } from "@/lib/theme";

function fmtTime(h: number, m: number): string {
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export function RemindersCard() {
  const [prefs, setPrefs] = useState<ReminderPrefs>(DEFAULT_PREFS);
  const [ready, setReady] = useState(false);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const nativeOk = isNotificationsAvailable();

  useEffect(() => {
    loadPrefs().then((p) => {
      setPrefs(p);
      setReady(true);
    });
    scheduledCount().then(setCount);
  }, []);

  const enableAll = async () => {
    setBusy(true);
    const ok = await ensurePermission();
    if (!ok) {
      Alert.alert(
        "Notifications blocked",
        "Open Settings → MacroTrack → Notifications and allow Alerts, then come back."
      );
      setBusy(false);
      return;
    }
    const next: ReminderPrefs = { ...DEFAULT_PREFS, enabled: true };
    setPrefs(next);
    const n = await applyReminders(next);
    setCount(n);
    await sendWelcomeNotification();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setBusy(false);
  };

  const update = async (next: ReminderPrefs) => {
    setPrefs(next);
    if (next.enabled) {
      const ok = await ensurePermission();
      if (!ok) {
        Alert.alert("Enable notifications in iOS Settings to get reminders.");
        return;
      }
    }
    const n = await applyReminders(next);
    setCount(n);
    Haptics.selectionAsync();
  };

  const toggle = (key: keyof ReminderPrefs) => (v: boolean) =>
    update({ ...prefs, [key]: v });

  const shiftHour = (delta: number) => {
    const h = (prefs.workoutHour + delta + 24) % 24;
    update({ ...prefs, workoutHour: h });
  };

  if (!ready) return null;

  if (!nativeOk) {
    return (
      <Card>
        <Row style={{ gap: 8, marginBottom: 4 }}>
          <Ionicons name="notifications" size={20} color={theme.colors.accentWarm} />
          <AppText bold size={17}>
            Phone reminders
          </AppText>
        </Row>
        <AppText muted size={13} style={{ marginBottom: 8 }}>
          Needs a fresh Xcode install — this build is missing the notifications native module.
        </AppText>
        <AppText muted size={12}>
          On your Mac: in mobile/, run `npx expo prebuild --clean`, then open
          ios/MacroTrack.xcworkspace and press Run.
        </AppText>
      </Card>
    );
  }

  return (
    <Card>
      <Row style={{ gap: 8, marginBottom: 4 }}>
        <Ionicons name="notifications" size={20} color={theme.colors.accentWarm} />
        <AppText bold size={17}>
          Phone reminders
        </AppText>
      </Row>
      <AppText muted size={12} style={{ marginBottom: 12 }}>
        Pop-up alerts on this iPhone — workout, shakes, water, logging.{" "}
        {count > 0 ? `${count} scheduled.` : ""}
      </AppText>

      {!prefs.enabled ? (
        <Button
          label={busy ? "Setting up…" : "Turn on all reminders"}
          onPress={enableAll}
          loading={busy}
        />
      ) : (
        <>
          <ToggleRow label="Master on/off" value={prefs.enabled} onChange={toggle("enabled")} accent />
          <ToggleRow label="Morning weigh-in (7:00 AM)" value={prefs.weighIn} onChange={toggle("weighIn")} />
          <ToggleRow label="4× daily shake protocol" value={prefs.shakes} onChange={toggle("shakes")} />
          <ToggleRow label="Supplements AM/PM" value={prefs.supplements} onChange={toggle("supplements")} />
          <ToggleRow label="Water checks (3×)" value={prefs.water} onChange={toggle("water")} />
          <ToggleRow
            label="Protein target check (8 PM)"
            value={prefs.proteinCheck}
            onChange={toggle("proteinCheck")}
          />
          <ToggleRow label="Log dinner reminder" value={prefs.logDinner} onChange={toggle("logDinner")} />
          <ToggleRow label="Daily workout nudge" value={prefs.workout} onChange={toggle("workout")} />
          {prefs.workout && (
            <Row style={{ justifyContent: "space-between", marginBottom: 8, marginLeft: 4 }}>
              <AppText muted size={13}>
                Workout time
              </AppText>
              <Row style={{ gap: 12 }}>
                <Pressable onPress={() => shiftHour(-1)} hitSlop={8}>
                  <Ionicons name="remove-circle-outline" size={22} color={theme.colors.accent} />
                </Pressable>
                <AppText bold size={14} style={{ minWidth: 78, textAlign: "center" }}>
                  {fmtTime(prefs.workoutHour, prefs.workoutMinute)}
                </AppText>
                <Pressable onPress={() => shiftHour(1)} hitSlop={8}>
                  <Ionicons name="add-circle-outline" size={22} color={theme.colors.accent} />
                </Pressable>
              </Row>
            </Row>
          )}
          <ToggleRow label="Steps check (7 PM)" value={prefs.steps} onChange={toggle("steps")} />
          <ToggleRow label="Sauna Wed & Sun" value={prefs.sauna} onChange={toggle("sauna")} />
        </>
      )}
    </Card>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
  accent,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  accent?: boolean;
}) {
  return (
    <Row style={{ justifyContent: "space-between", paddingVertical: 7 }}>
      <AppText size={14} bold={accent} style={{ flex: 1, paddingRight: 8 }}>
        {label}
      </AppText>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: theme.colors.cardBorder, true: `${theme.colors.accent}99` }}
        thumbColor={value ? theme.colors.accent : "#f4f3f4"}
      />
    </Row>
  );
}
