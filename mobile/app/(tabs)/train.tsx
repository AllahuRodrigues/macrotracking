import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { SegmentBar } from "@/components/SegmentBar";
import { ScreenTitle } from "@/components/ui";
import { theme } from "@/lib/theme";
import Workout from "./workout";
import Plan from "./plan";
import Rituals from "./rituals";

type Seg = "workout" | "plan" | "rituals";

function isSeg(v: unknown): v is Seg {
  return v === "workout" || v === "plan" || v === "rituals";
}

export default function TrainHub() {
  const params = useLocalSearchParams<{ seg?: string }>();
  const [seg, setSeg] = useState<Seg>(isSeg(params.seg) ? params.seg : "workout");

  useEffect(() => {
    if (isSeg(params.seg)) setSeg(params.seg);
  }, [params.seg]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaView edges={["top"]} style={{ paddingHorizontal: 16, paddingTop: 4 }}>
        <ScreenTitle title="Train" subtitle="Session · plan · rituals" />
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
        {seg === "workout" ? <Workout embedded /> : null}
        {seg === "plan" ? <Plan embedded /> : null}
        {seg === "rituals" ? <Rituals embedded /> : null}
      </View>
    </View>
  );
}
