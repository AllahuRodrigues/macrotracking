import React, { useState } from "react";
import { ScrollView, View, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { SegmentBar } from "@/components/SegmentBar";
import { InsightsHero, InsightsDetail } from "@/components/InsightsCard";
import { QuickLogBar } from "@/components/QuickLog";
import { AppText, ScreenTitle } from "@/components/ui";
import { theme } from "@/lib/theme";
import { api } from "@/api/client";
import Body from "./body";
import Photos from "./photos";
import Stats from "./stats";

type Seg = "science" | "body" | "photos" | "charts";

const SEGMENTS: { key: Seg; label: string }[] = [
  { key: "science", label: "Insights" },
  { key: "charts", label: "Charts" },
  { key: "body", label: "Body" },
  { key: "photos", label: "Photos" },
];

function SegmentHeader({ seg, setSeg }: { seg: Seg; setSeg: (s: Seg) => void }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
      <SegmentBar options={SEGMENTS} value={seg} onChange={setSeg} />
    </View>
  );
}

export default function ProgressHub() {
  const [seg, setSeg] = useState<Seg>("science");
  const insights = useQuery({
    queryKey: ["insights"],
    queryFn: () => api.getInsights(60),
  });

  if (seg === "body") {
    return (
      <View style={{ flex: 1 }}>
        <SegmentHeader seg={seg} setSeg={setSeg} />
        <Body />
      </View>
    );
  }
  if (seg === "photos") {
    return (
      <View style={{ flex: 1 }}>
        <SegmentHeader seg={seg} setSeg={setSeg} />
        <Photos />
      </View>
    );
  }
  if (seg === "charts") {
    return (
      <View style={{ flex: 1 }}>
        <SegmentHeader seg={seg} setSeg={setSeg} />
        <Stats />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={insights.isFetching}
            onRefresh={() => insights.refetch()}
            tintColor={theme.colors.accent}
          />
        }
      >
        <ScreenTitle title="Progress" subtitle="What happened · why · what next" />
        <QuickLogBar />
        <SegmentBar options={SEGMENTS} value={seg} onChange={setSeg} />
        {insights.isLoading && <AppText muted>Loading insights…</AppText>}
        {insights.data && (
          <>
            <InsightsHero data={insights.data} />
            <View style={{ height: 12 }} />
            <InsightsDetail data={insights.data} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
