import React, { useState } from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PressableScale } from "@/components/anim";
import { SegmentBar } from "@/components/SegmentBar";
import { theme } from "@/lib/theme";
import Meals from "./meals";
import Supplements from "./supplements";

type Seg = "meals" | "supps";

export default function LogHub() {
  const [seg, setSeg] = useState<Seg>("meals");
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <SegmentBar
          options={[
            { key: "meals", label: "Food" },
            { key: "supps", label: "Supps" },
          ]}
          value={seg}
          onChange={setSeg}
        />
        <PressableScale onPress={() => router.push("/ai-scan")} style={{ marginBottom: 4 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              paddingVertical: 11,
              borderRadius: theme.radius.md,
              backgroundColor: `${theme.colors.accentWarm}18`,
              borderWidth: 1,
              borderColor: `${theme.colors.accentWarm}44`,
            }}
          >
            <Ionicons name="sparkles" size={18} color={theme.colors.accentWarm} />
            <Text style={{ color: theme.colors.accentWarm, fontWeight: "800", fontSize: 14 }}>
              AI scan meal
            </Text>
          </View>
        </PressableScale>
      </SafeAreaView>
      <View style={{ flex: 1 }}>{seg === "meals" ? <Meals /> : <Supplements />}</View>
    </View>
  );
}
