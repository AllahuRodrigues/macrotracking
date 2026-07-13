import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/lib/AuthContext";
import { theme } from "@/lib/theme";

export default function Index() {
  const { role, ready } = useAuth();

  useEffect(() => {
    if (!ready) return;
    if (role) router.replace("/(tabs)");
    else router.replace("/gate");
  }, [ready, role]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.background }}>
      <ActivityIndicator color={theme.colors.accent} size="large" />
    </View>
  );
}
