import React, { useState } from "react";
import { ScrollView, View, Pressable, RefreshControl, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { router } from "expo-router";
import { todayISO, formatDateMedium } from "@shared/timezone";
import { INBODY_REPORT } from "@shared/inbody-report";
import {
  JOURNEY_GOAL_WEIGHT_LBS,
  JOURNEY_END_ISO,
  daysUntilJourneyEnd,
  journeyProgressPct,
} from "@shared/body-journey";
import { useBody, usePhotos } from "@/api/queries";
import { useAuth } from "@/lib/AuthContext";
import { imageUrl } from "@/lib/images";
import { Card, AppText, ScreenTitle, Row, Pill, Button } from "@/components/ui";
import { QuickLogBar, WeighModal, InBodyModal, PhotoModal } from "@/components/QuickLog";
import { ImageViewer, type ViewerPhoto } from "@/components/ImageViewer";
import { theme } from "@/lib/theme";

const THUMB = (Dimensions.get("window").width - 16 * 2 - 8 * 2) / 3;

export default function Body({
  embedded = false,
  onOpenPhotos,
}: {
  embedded?: boolean;
  onOpenPhotos?: () => void;
}) {
  const { canWrite } = useAuth();
  const body = useBody();
  const recentPhotos = usePhotos("body");
  const [weigh, setWeigh] = useState(false);
  const [inbody, setInbody] = useState(false);
  const [photo, setPhoto] = useState(false);
  const [viewerIdx, setViewerIdx] = useState<number | null>(null);

  const list = body.data ?? [];
  const latest = list[0];
  const r = INBODY_REPORT;
  const daysLeft = daysUntilJourneyEnd();
  const progress = journeyProgressPct();
  const thumbs = (recentPhotos.data ?? []).slice(0, 6);
  const viewerPhotos: ViewerPhoto[] = thumbs.map((p) => ({
    id: p.id,
    filename: p.filename,
    date: p.date,
    caption: p.caption,
    category: p.category,
  }));

  const openAllPhotos = () => {
    if (onOpenPhotos) onOpenPhotos();
    else router.push({ pathname: "/(tabs)/progress", params: { seg: "photos" } });
  };

  const content = (
    <>
      {!embedded ? (
        <ScreenTitle title="Body & InBody" subtitle="Weigh-in · scan · open photos" />
      ) : (
        <AppText muted size={13} style={{ marginBottom: 10 }}>
          Latest scan · tap a photo to open
        </AppText>
      )}

      {canWrite ? <QuickLogBar /> : null}

      <Card style={{ marginBottom: 16 }}>
        <Row style={{ justifyContent: "space-between", marginBottom: 8 }}>
          <AppText bold>Cut to {formatDateMedium(JOURNEY_END_ISO)}</AppText>
          <Pill label={`${daysLeft}d left`} color={theme.colors.accentWarm} />
        </Row>
        <View
          style={{
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.colors.cardBorder,
            overflow: "hidden",
            marginBottom: 8,
          }}
        >
          <View style={{ width: `${progress}%`, height: "100%", backgroundColor: theme.colors.accent }} />
        </View>
        <Row style={{ justifyContent: "space-between" }}>
          <AppText muted size={12}>
            Now {latest?.weight_lbs ?? r.bodyComposition.weightLb} lb
          </AppText>
          <AppText muted size={12}>
            Goal {JOURNEY_GOAL_WEIGHT_LBS} lb
          </AppText>
        </Row>
      </Card>

      {latest ? (
        <Row style={{ flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          <Tile label="Weight" value={`${latest.weight_lbs ?? "—"}`} unit="lb" />
          <Tile label="Body Fat" value={`${latest.body_fat_pct ?? "—"}`} unit="%" />
          <Tile label="Muscle" value={`${latest.muscle_mass_lbs ?? "—"}`} unit="lb" />
          <Tile label="InBody" value={`${latest.inbody_score ?? "—"}`} accent />
        </Row>
      ) : null}

      {/* Recent body photos — tappable */}
      <Card style={{ marginBottom: 16 }}>
        <Row style={{ justifyContent: "space-between", marginBottom: 10 }}>
          <AppText bold>Body photos</AppText>
          <Pressable onPress={openAllPhotos} hitSlop={8}>
            <AppText bold size={13} color={theme.colors.accent}>
              See all →
            </AppText>
          </Pressable>
        </Row>
        {thumbs.length ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {thumbs.map((p, idx) => (
              <Pressable key={p.id} onPress={() => setViewerIdx(idx)}>
                <Image
                  source={{ uri: imageUrl(p.filename) ?? undefined }}
                  style={{
                    width: THUMB,
                    height: THUMB * 1.25,
                    borderRadius: theme.radius.sm,
                    backgroundColor: theme.colors.background,
                  }}
                  contentFit="cover"
                />
              </Pressable>
            ))}
          </View>
        ) : (
          <AppText muted size={13} style={{ marginBottom: 8 }}>
            No body photos yet.
          </AppText>
        )}
        {canWrite ? (
          <View style={{ marginTop: 12, gap: 8 }}>
            <Button label="Add body photo" variant="ghost" onPress={() => setPhoto(true)} />
            <Button label="Log weigh-in" variant="ghost" onPress={() => setWeigh(true)} />
          </View>
        ) : null}
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Row style={{ justifyContent: "space-between", marginBottom: 10 }}>
          <AppText bold>InBody 580 — {r.meta.testDate}</AppText>
          <Pill label={`Score ${r.meta.score}`} />
        </Row>
        <MetricLine label="Skeletal Muscle" value={`${r.muscleFatAnalysis.skeletalMuscleMassLb} lb`} />
        <MetricLine
          label="Body Fat"
          value={`${r.obesityAnalysis.bodyFatMassLb} lb (${r.obesityAnalysis.percentBodyFatOfficial}%)`}
        />
        <MetricLine
          label="Visceral Fat"
          value={`${r.obesityAnalysis.visceralFatAreaCm2} cm² · Lv ${r.obesityAnalysis.visceralFatLevel}`}
        />
        <MetricLine label="Phase Angle" value={`${r.comprehensive.phaseAngle}°`} />
        <MetricLine label="FFMI" value={`${r.comprehensive.ffmi}`} />
        {canWrite ? (
          <Pressable onPress={() => setInbody(true)} style={{ marginTop: 12 }}>
            <AppText color={theme.colors.accent} bold size={13}>
              + Log a new InBody scan
            </AppText>
          </Pressable>
        ) : null}
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Row style={{ justifyContent: "space-between", marginBottom: 10 }}>
          <AppText bold>EGYM Strength</AppText>
          <Pill label={r.bioAge.egymRanking} color={theme.colors.accent} />
        </Row>
        <MetricLine label="Chest Press" value={`${r.bioAge.egymChestPressLb} lb`} />
        <MetricLine label="Shoulder Press" value={`${r.bioAge.egymShoulderPressLb} lb`} />
        <MetricLine label="Lat Pulldown" value={`${r.bioAge.egymLatPulldownLb} lb`} />
        <MetricLine label="Seated Row" value={`${r.bioAge.egymSeatedRowLb} lb`} />
        <MetricLine label="Leg Press" value={`${r.bioAge.egymLegPressLb} lb`} />
      </Card>

      <AppText muted bold size={12} style={{ textTransform: "uppercase", marginBottom: 8 }}>
        History
      </AppText>
      {list.map((m) => (
        <Card key={m.id} style={{ marginBottom: 8, paddingVertical: 12 }}>
          <Row style={{ justifyContent: "space-between" }}>
            <AppText size={14}>{formatDateMedium(m.date)}</AppText>
            <AppText bold>{m.weight_lbs ?? "—"} lb</AppText>
          </Row>
          {m.inbody_score != null ? (
            <AppText muted size={12} style={{ marginTop: 2 }}>
              Score {m.inbody_score}
              {m.body_fat_pct != null ? ` · BF ${m.body_fat_pct}%` : ""}
            </AppText>
          ) : null}
          {m.notes ? (
            <AppText muted size={12} style={{ marginTop: 4 }}>
              {m.notes}
            </AppText>
          ) : null}
        </Card>
      ))}

      <WeighModal visible={weigh} date={todayISO()} onClose={() => setWeigh(false)} />
      <InBodyModal
        visible={inbody}
        date={todayISO()}
        onClose={() => {
          setInbody(false);
          body.refetch();
        }}
      />
      <PhotoModal
        visible={photo}
        date={todayISO()}
        onClose={() => {
          setPhoto(false);
          recentPhotos.refetch();
        }}
      />
      <ImageViewer
        photos={viewerPhotos}
        index={viewerIdx ?? 0}
        visible={viewerIdx != null}
        onClose={() => setViewerIdx(null)}
      />
    </>
  );

  if (embedded) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={body.isFetching}
            onRefresh={() => {
              body.refetch();
              recentPhotos.refetch();
            }}
            tintColor={theme.colors.accent}
          />
        }
      >
        {content}
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={body.isFetching}
            onRefresh={() => {
              body.refetch();
              recentPhotos.refetch();
            }}
            tintColor={theme.colors.accent}
          />
        }
      >
        {content}
      </ScrollView>
    </SafeAreaView>
  );
}

function Tile({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: boolean;
}) {
  return (
    <View
      style={{
        flexGrow: 1,
        minWidth: "45%",
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.cardBorder,
        borderWidth: 1,
        borderRadius: theme.radius.md,
        padding: 14,
        alignItems: "center",
      }}
    >
      <AppText muted size={11}>
        {label}
      </AppText>
      <Row style={{ alignItems: "baseline", gap: 2 }}>
        <AppText bold size={24} color={accent ? theme.colors.accent : theme.colors.foreground}>
          {value}
        </AppText>
        {unit ? (
          <AppText muted size={12}>
            {unit}
          </AppText>
        ) : null}
      </Row>
    </View>
  );
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <Row
      style={{
        justifyContent: "space-between",
        paddingVertical: 6,
        borderTopWidth: 1,
        borderTopColor: `${theme.colors.cardBorder}99`,
      }}
    >
      <AppText muted size={13}>
        {label}
      </AppText>
      <AppText size={13} bold>
        {value}
      </AppText>
    </Row>
  );
}
