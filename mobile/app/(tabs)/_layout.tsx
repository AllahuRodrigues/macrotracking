import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@/lib/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function tabIcon(focusedName: IconName, outlineName: IconName) {
  const Icon = ({ color, focused }: { color: string; size: number; focused: boolean }) => (
    <Ionicons name={focused ? focusedName : outlineName} color={color} size={24} />
  );
  Icon.displayName = `TabIcon(${focusedName})`;
  return Icon;
}

/** 5 big tabs sized for iPhone 13 Pro + home indicator. */
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 10);
  const barHeight = 54 + bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.cardBorder,
          height: barHeight,
          paddingTop: 6,
          paddingBottom: bottom,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home", tabBarIcon: tabIcon("home", "home-outline") }}
      />
      <Tabs.Screen
        name="log"
        options={{ title: "Log", tabBarIcon: tabIcon("create", "create-outline") }}
      />
      <Tabs.Screen
        name="train"
        options={{ title: "Train", tabBarIcon: tabIcon("barbell", "barbell-outline") }}
      />
      <Tabs.Screen
        name="progress"
        options={{ title: "Progress", tabBarIcon: tabIcon("analytics", "analytics-outline") }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "You", tabBarIcon: tabIcon("person", "person-outline") }}
      />

      <Tabs.Screen name="rituals" options={{ href: null }} />
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
