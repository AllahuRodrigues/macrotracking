import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/lib/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function tabIcon(name: IconName) {
  const Icon = ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} color={color} size={size} />
  );
  Icon.displayName = `TabIcon(${name})`;
  return Icon;
}

/** Premium 5-tab layout — deep screens stay reachable but hidden from the bar. */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.cardBorder,
          height: 56,
          paddingBottom: 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: tabIcon("home") }} />
      <Tabs.Screen name="log" options={{ title: "Log", tabBarIcon: tabIcon("create") }} />
      <Tabs.Screen name="train" options={{ title: "Train", tabBarIcon: tabIcon("barbell") }} />
      <Tabs.Screen name="progress" options={{ title: "Progress", tabBarIcon: tabIcon("analytics") }} />
      <Tabs.Screen name="profile" options={{ title: "You", tabBarIcon: tabIcon("person") }} />

      {/* Hidden — reachable from hubs */}
      <Tabs.Screen name="meals" options={{ href: null }} />
      <Tabs.Screen name="workout" options={{ href: null }} />
      <Tabs.Screen name="plan" options={{ href: null }} />
      <Tabs.Screen name="supplements" options={{ href: null }} />
      <Tabs.Screen name="body" options={{ href: null }} />
      <Tabs.Screen name="photos" options={{ href: null }} />
      <Tabs.Screen name="stats" options={{ href: null }} />
    </Tabs>
  );
}
