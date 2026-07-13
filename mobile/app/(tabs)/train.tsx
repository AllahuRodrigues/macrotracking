import React, { useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SegmentBar } from "@/components/SegmentBar";
import { theme } from "@/lib/theme";
import Workout from "./workout";
import Plan from "./plan";
import Rituals from "./rituals";

type Seg = "workout" | "plan" | "rituals";

export default function TrainHub() {
  const [seg, setSeg] = useState<Seg>("workout");

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <SegmentBar
          options={[
            { key: "workout", label: "Session" },
            { key: "plan", label: "Plan" },
            { key: "rituals", label: "Rituals" },
          ]}
          value={seg}
          onChange={setSeg}
        />
      </SafeAreaView>
      <View style={{ flex: 1 }}>
        {seg === "workout" ? <Workout /> : seg === "plan" ? <Plan /> : <Rituals />}
      </View>
    </View>
  );
}
