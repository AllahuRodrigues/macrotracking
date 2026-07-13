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
        },
        tabBarLabelStyle: { fontSize: 10 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: tabIcon("home") }} />
      <Tabs.Screen name="meals" options={{ title: "Meals", tabBarIcon: tabIcon("restaurant") }} />
      <Tabs.Screen name="workout" options={{ title: "Workout", tabBarIcon: tabIcon("barbell") }} />
      <Tabs.Screen name="supplements" options={{ title: "Supps", tabBarIcon: tabIcon("medkit") }} />
      <Tabs.Screen name="body" options={{ title: "Body", tabBarIcon: tabIcon("body") }} />
      <Tabs.Screen name="photos" options={{ title: "Photos", tabBarIcon: tabIcon("camera") }} />
      <Tabs.Screen name="stats" options={{ title: "Stats", tabBarIcon: tabIcon("stats-chart") }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: tabIcon("person") }} />
    </Tabs>
  );
}
