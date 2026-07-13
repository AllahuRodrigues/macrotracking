import React from "react";
import { View, Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { shiftDateISO, formatDateMedium, todayISO, isTodayISO } from "@shared/timezone";
import { theme } from "@/lib/theme";

export function DateNav({
  date,
  onChange,
}: {
  date: string;
  onChange: (iso: string) => void;
}) {
  const go = (days: number) => {
    Haptics.selectionAsync();
    onChange(shiftDateISO(date, days));
  };
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.cardBorder,
        borderWidth: 1,
        borderRadius: theme.radius.md,
        padding: 8,
        marginBottom: 16,
      }}
    >
      <Pressable onPress={() => go(-1)} hitSlop={12} style={{ padding: 6 }}>
        <Ionicons name="chevron-back" size={22} color={theme.colors.foreground} />
      </Pressable>
      <Pressable onPress={() => onChange(todayISO())} style={{ alignItems: "center" }}>
        <Text style={{ color: theme.colors.foreground, fontWeight: "700", fontSize: 15 }}>
          {formatDateMedium(date)}
        </Text>
        {!isTodayISO(date) ? (
          <Text style={{ color: theme.colors.accent, fontSize: 11 }}>Tap for today</Text>
        ) : (
          <Text style={{ color: theme.colors.muted, fontSize: 11 }}>Today</Text>
        )}
      </Pressable>
      <Pressable onPress={() => go(1)} hitSlop={12} style={{ padding: 6 }}>
        <Ionicons name="chevron-forward" size={22} color={theme.colors.foreground} />
      </Pressable>
    </View>
  );
}
