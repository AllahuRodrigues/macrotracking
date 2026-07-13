import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { theme } from "@/lib/theme";

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Row({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export function AppText({
  children,
  style,
  muted,
  bold,
  size,
  color,
}: {
  children: React.ReactNode;
  style?: TextStyle;
  muted?: boolean;
  bold?: boolean;
  size?: number;
  color?: string;
}) {
  return (
    <Text
      style={[
        {
          color: color ?? (muted ? theme.colors.muted : theme.colors.foreground),
          fontSize: size ?? 15,
          fontWeight: bold ? "700" : "400",
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  const bg =
    variant === "primary"
      ? theme.colors.accent
      : variant === "danger"
      ? theme.colors.red
      : "transparent";
  const fg = variant === "ghost" ? theme.colors.foreground : "#04140b";
  return (
    <Pressable
      disabled={disabled || loading}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: bg,
          borderWidth: variant === "ghost" ? 1 : 0,
          borderColor: theme.colors.cardBorder,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={{ color: fg, fontWeight: "700", fontSize: 15 }}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Pill({
  label,
  color = theme.colors.accent,
}: {
  label: string;
  color?: string;
}) {
  return (
    <View
      style={{
        backgroundColor: `${color}22`,
        borderRadius: theme.radius.pill,
        paddingHorizontal: 10,
        paddingVertical: 3,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ color, fontSize: 11, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}

export function ScreenTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.h1}>{title}</Text>
      {subtitle ? <AppText muted size={13} style={{ marginTop: 2 }}>{subtitle}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.cardBorder,
    borderWidth: 1,
    borderRadius: theme.radius.lg,
    padding: 16,
  },
  row: { flexDirection: "row", alignItems: "center" },
  btn: {
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  h1: { color: theme.colors.foreground, fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
});
