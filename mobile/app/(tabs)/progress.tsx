import React, { useEffect, useState } from "react";
import { ScrollView, View, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
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

type Seg = "body" | "photos" | "science" | "charts";

const SEGMENTS: { key: Seg; label: string }[] = [
  { key: "body", label: "Body" },
  { key: "photos", label: "Photos" },
  { key: "science", label: "Insights" },
  { key: "charts", label: "Charts" },
];

function isSeg(v: unknown): v is Seg {
  return v === "body" || v === "photos" || v === "science" || v === "charts";
}

/** Progress hub — Body & Photos first so they’re one tap away. */
export default function ProgressHub() {
  const params = useLocalSearchParams<{ seg?: string }>();
  const [seg, setSeg] = useState<Seg>(isSeg(params.seg) ? params.seg : "body");
  const insights = useQuery({
    queryKey: ["insights"],
    queryFn: () => api.getInsights(60),
  });

  useEffect(() => {
    if (isSeg(params.seg)) setSeg(params.seg);
  }, [params.seg]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top"]}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <ScreenTitle title="Progress" subtitle="Body · photos · insights · charts" />
        <SegmentBar options={SEGMENTS} value={seg} onChange={setSeg} />
      </View>

      {seg === "body" ? (
        <Body embedded onOpenPhotos={() => setSeg("photos")} />
      ) : null}

      {seg === "photos" ? <Photos embedded /> : null}

      {seg === "charts" ? <Stats embedded /> : null}

      {seg === "science" ? (
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
          <QuickLogBar />
          {insights.isLoading && <AppText muted>Loading insights…</AppText>}
          {insights.data && (
            <>
              <InsightsHero data={insights.data} />
              <View style={{ height: 12 }} />
              <InsightsDetail data={insights.data} />
            </>
          )}
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}
