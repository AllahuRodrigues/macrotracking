import React, { useState } from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PressableScale } from "@/components/anim";
import { SegmentBar } from "@/components/SegmentBar";
import { QuickLogBar } from "@/components/QuickLog";
import { AppText, ScreenTitle } from "@/components/ui";
import { theme } from "@/lib/theme";
import Meals from "./meals";
import Supplements from "./supplements";

type Seg = "meals" | "supps";

/** Log hub — start workout + quick body log + food/supps. */
export default function LogHub() {
  const [seg, setSeg] = useState<Seg>("meals");
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 16, paddingTop: 4 }}>
        <ScreenTitle title="Log" subtitle="Food · body · start workout" />

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
          <PressableScale
            onPress={() => router.push("/(tabs)/train")}
            style={{ flex: 1 }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                minHeight: 48,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.accent,
                paddingHorizontal: 12,
              }}
            >
              <Ionicons name="barbell" size={18} color="#04140b" />
              <Text style={{ color: "#04140b", fontWeight: "800", fontSize: 14 }}>Start workout</Text>
            </View>
          </PressableScale>
          <PressableScale onPress={() => router.push("/ai-scan")} style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                minHeight: 48,
                borderRadius: theme.radius.md,
                backgroundColor: `${theme.colors.accentWarm}22`,
                borderWidth: 1,
                borderColor: `${theme.colors.accentWarm}55`,
                paddingHorizontal: 12,
              }}
            >
              <Ionicons name="sparkles" size={18} color={theme.colors.accentWarm} />
              <Text style={{ color: theme.colors.accentWarm, fontWeight: "800", fontSize: 14 }}>
                AI scan
              </Text>
            </View>
          </PressableScale>
        </View>

        <QuickLogBar />

        <SegmentBar
          options={[
            { key: "meals", label: "Food" },
            { key: "supps", label: "Supps" },
          ]}
          value={seg}
          onChange={setSeg}
        />
        <AppText muted size={12} style={{ marginBottom: 4 }}>
          {seg === "meals" ? "Add meals below" : "Check off today’s stack"}
        </AppText>
      </SafeAreaView>
      <View style={{ flex: 1 }}>{seg === "meals" ? <Meals embedded /> : <Supplements embedded />}</View>
    </View>
  );
}
