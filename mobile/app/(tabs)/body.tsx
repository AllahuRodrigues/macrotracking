import React, { useState } from "react";
import { ScrollView, View, Modal, Pressable, TextInput, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { todayISO, formatDateMedium } from "@shared/timezone";
import { INBODY_REPORT } from "@shared/inbody-report";
import {
  JOURNEY_GOAL_WEIGHT_LBS,
  JOURNEY_END_ISO,
  daysUntilJourneyEnd,
  journeyProgressPct,
} from "@shared/body-journey";
import type { BodyMetric } from "@shared/types";
import { useBody, useCreateBody } from "@/api/queries";
import { useAuth } from "@/lib/AuthContext";
import { Card, AppText, ScreenTitle, Row, Pill, Button } from "@/components/ui";
import { theme } from "@/lib/theme";

export default function Body() {
  const { canWrite } = useAuth();
  const body = useBody();
  const createBody = useCreateBody();
  const [modal, setModal] = useState(false);

  const list = body.data ?? [];
  const latest = list[0];
  const r = INBODY_REPORT;

  const daysLeft = daysUntilJourneyEnd();
  const progress = journeyProgressPct();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={body.isFetching} onRefresh={() => body.refetch()} tintColor={theme.colors.accent} />}
      >
        <Row style={{ justifyContent: "space-between" }}>
          <ScreenTitle title="Body & InBody" />
          {canWrite ? (
            <Pressable onPress={() => setModal(true)} style={{ padding: 8 }}>
              <Ionicons name="add-circle" size={30} color={theme.colors.accent} />
            </Pressable>
          ) : null}
        </Row>

        {/* Journey to Aug 1 */}
        <Card style={{ marginBottom: 16 }}>
          <Row style={{ justifyContent: "space-between", marginBottom: 8 }}>
            <AppText bold>Cut to {formatDateMedium(JOURNEY_END_ISO)}</AppText>
            <Pill label={`${daysLeft}d left`} color={theme.colors.accentWarm} />
          </Row>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: theme.colors.cardBorder, overflow: "hidden", marginBottom: 8 }}>
            <View style={{ width: `${progress}%`, height: "100%", backgroundColor: theme.colors.accent }} />
          </View>
          <Row style={{ justifyContent: "space-between" }}>
            <AppText muted size={12}>Now {latest?.weight_lbs ?? r.bodyComposition.weightLb} lb</AppText>
            <AppText muted size={12}>Goal {JOURNEY_GOAL_WEIGHT_LBS} lb</AppText>
          </Row>
        </Card>

        {/* Latest metric tiles */}
        {latest ? (
          <Row style={{ flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            <Tile label="Weight" value={`${latest.weight_lbs ?? "—"}`} unit="lb" />
            <Tile label="Body Fat" value={`${latest.body_fat_pct ?? "—"}`} unit="%" />
            <Tile label="Muscle" value={`${latest.muscle_mass_lbs ?? "—"}`} unit="lb" />
            <Tile label="InBody" value={`${latest.inbody_score ?? "—"}`} accent />
          </Row>
        ) : null}

        {/* InBody snapshot */}
        <Card style={{ marginBottom: 16 }}>
          <Row style={{ justifyContent: "space-between", marginBottom: 10 }}>
            <AppText bold>InBody 580 — {r.meta.testDate}</AppText>
            <Pill label={`Score ${r.meta.score}`} />
          </Row>
          <MetricLine label="Skeletal Muscle" value={`${r.muscleFatAnalysis.skeletalMuscleMassLb} lb`} />
          <MetricLine label="Body Fat" value={`${r.obesityAnalysis.bodyFatMassLb} lb (${r.obesityAnalysis.percentBodyFatOfficial}%)`} />
          <MetricLine label="Visceral Fat" value={`${r.obesityAnalysis.visceralFatAreaCm2} cm² · Lv ${r.obesityAnalysis.visceralFatLevel}`} />
          <MetricLine label="Phase Angle" value={`${r.comprehensive.phaseAngle}°`} />
          <MetricLine label="FFMI" value={`${r.comprehensive.ffmi}`} />
        </Card>

        {/* EGYM strength */}
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
          <MetricLine label="Leg Extension" value={`${r.bioAge.egymLegExtensionLb} lb`} />
          <MetricLine label="Leg Curl" value={`${r.bioAge.egymLegCurlLb} lb`} />
        </Card>

        {/* History */}
        <AppText muted bold size={12} style={{ textTransform: "uppercase", marginBottom: 8 }}>History</AppText>
        {list.map((m) => (
          <Card key={m.id} style={{ marginBottom: 8, paddingVertical: 12 }}>
            <Row style={{ justifyContent: "space-between" }}>
              <AppText size={14}>{formatDateMedium(m.date)}</AppText>
              <AppText bold>{m.weight_lbs ?? "—"} lb</AppText>
            </Row>
            {m.notes ? <AppText muted size={12} style={{ marginTop: 4 }}>{m.notes}</AppText> : null}
          </Card>
        ))}
      </ScrollView>

      <AddBodyModal
        visible={modal}
        onClose={() => setModal(false)}
        onSubmit={(data) => {
          createBody.mutate({ ...data, date: todayISO() });
          setModal(false);
        }}
      />
    </SafeAreaView>
  );
}

function Tile({ label, value, unit, accent }: { label: string; value: string; unit?: string; accent?: boolean }) {
  return (
    <View style={{ flexGrow: 1, minWidth: "45%", backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder, borderWidth: 1, borderRadius: theme.radius.md, padding: 14, alignItems: "center" }}>
      <AppText muted size={11}>{label}</AppText>
      <Row style={{ alignItems: "baseline", gap: 2 }}>
        <AppText bold size={24} color={accent ? theme.colors.accent : theme.colors.foreground}>{value}</AppText>
        {unit ? <AppText muted size={12}>{unit}</AppText> : null}
      </Row>
    </View>
  );
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <Row style={{ justifyContent: "space-between", paddingVertical: 6, borderTopWidth: 1, borderTopColor: `${theme.colors.cardBorder}99` }}>
      <AppText muted size={13}>{label}</AppText>
      <AppText size={13} bold>{value}</AppText>
    </Row>
  );
}

function AddBodyModal({ visible, onClose, onSubmit }: { visible: boolean; onClose: () => void; onSubmit: (d: Partial<BodyMetric>) => void }) {
  const [w, setW] = useState("");
  const [bf, setBf] = useState("");
  const input = { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder, borderWidth: 1, borderRadius: theme.radius.md, color: theme.colors.foreground, padding: 12, fontSize: 15 } as const;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "#000a" }}>
        <View style={{ backgroundColor: theme.colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12 }}>
          <Row style={{ justifyContent: "space-between" }}>
            <AppText bold size={18}>Log body metric</AppText>
            <Pressable onPress={onClose}><Ionicons name="close" size={24} color={theme.colors.muted} /></Pressable>
          </Row>
          <TextInput placeholder="Weight (lb)" placeholderTextColor={theme.colors.muted} value={w} onChangeText={setW} keyboardType="numeric" style={input} />
          <TextInput placeholder="Body fat %" placeholderTextColor={theme.colors.muted} value={bf} onChangeText={setBf} keyboardType="numeric" style={input} />
          <Button label="Save" onPress={() => onSubmit({ weight_lbs: parseFloat(w) || undefined, body_fat_pct: parseFloat(bf) || undefined })} />
        </View>
      </View>
    </Modal>
  );
}
