import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { todayISO } from "@shared/timezone";
import { MEAL_TYPES, mealLabel } from "@shared/utils";
import type { MealType } from "@shared/types";
import { api, type AnalyzedFoodItem, type AnalyzeFoodResult } from "@/api/client";
import { Card, AppText, Button, Row, Pill } from "@/components/ui";
import { theme } from "@/lib/theme";

type EditableItem = AnalyzedFoodItem & { include: boolean };

export default function AiScan() {
  const router = useRouter();
  const qc = useQueryClient();
  const params = useLocalSearchParams<{ date?: string; meal?: string }>();
  const date = params.date ?? todayISO();

  const [meal, setMeal] = useState<MealType>((params.meal as MealType) || "lunch");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeFoodResult | null>(null);
  const [items, setItems] = useState<EditableItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [budget, setBudget] = useState<{ remaining_usd: number } | null>(null);

  useEffect(() => {
    api.getAiUsage().then(setBudget).catch(() => {});
  }, []);

  const pick = async (mode: "camera" | "library") => {
    const opts: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.4,
      base64: true,
    };
    const res =
      mode === "camera"
        ? await (async () => {
            const perm = await ImagePicker.requestCameraPermissionsAsync();
            if (!perm.granted) {
              Alert.alert("Camera permission needed");
              return null;
            }
            return ImagePicker.launchCameraAsync(opts);
          })()
        : await ImagePicker.launchImageLibraryAsync(opts);
    if (!res || res.canceled || !res.assets?.length) return;
    const asset = res.assets[0];
    setImageUri(asset.uri);
    const mime = asset.mimeType ?? "image/jpeg";
    if (asset.base64) setDataUrl(`data:${mime};base64,${asset.base64}`);
    setResult(null);
    setItems([]);
  };

  const analyze = async () => {
    if (!dataUrl) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const r = await api.analyzeFood(dataUrl, hint.trim() || undefined);
      setResult(r);
      setItems(r.items.map((it) => ({ ...it, include: true })));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      api.getAiUsage().then(setBudget).catch(() => {});
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Analysis failed", (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (i: number) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, include: !it.include } : it)));

  const included = items.filter((it) => it.include);
  const totals = included.reduce(
    (a, it) => ({
      calories: a.calories + it.calories,
      protein: a.protein + it.protein,
      carbs: a.carbs + it.carbs,
      fat: a.fat + it.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const save = async () => {
    if (!included.length) return;
    setSaving(true);
    try {
      for (const it of included) {
        await api.createEntry({
          date,
          meal_type: meal,
          name: it.quantity ? `${it.name} (${it.quantity})` : it.name,
          calories: it.calories,
          protein: it.protein,
          carbs: it.carbs,
          fat: it.fat,
          notes: "Logged via AI photo scan",
        });
      }
      qc.invalidateQueries({ queryKey: ["entries", date] });
      qc.invalidateQueries({ queryKey: ["summary", date] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      Alert.alert("Could not save", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const input = {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.cardBorder,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    color: theme.colors.foreground,
    padding: 12,
    fontSize: 15,
  } as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }}>
        <Row style={{ justifyContent: "space-between" }}>
          <View>
            <Text style={{ color: theme.colors.foreground, fontSize: 24, fontWeight: "800" }}>AI Food Scan</Text>
            <AppText muted size={13}>Snap a meal — get macros in seconds</AppText>
          </View>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="close" size={26} color={theme.colors.muted} />
          </Pressable>
        </Row>

        {budget ? (
          <Pill
            label={`Budget left today: $${budget.remaining_usd.toFixed(2)}`}
            color={budget.remaining_usd > 0 ? theme.colors.accent : theme.colors.red}
          />
        ) : null}

        {/* Image area */}
        <Card style={{ alignItems: "center", padding: 12 }}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={{ width: "100%", height: 220, borderRadius: theme.radius.md }} resizeMode="cover" />
          ) : (
            <View style={{ height: 160, alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Ionicons name="fast-food-outline" size={48} color={theme.colors.muted} />
              <AppText muted size={13}>Take or choose a photo of your food</AppText>
            </View>
          )}
          <Row style={{ gap: 10, marginTop: 12, width: "100%" }}>
            <Button label="Camera" variant="ghost" onPress={() => pick("camera")} style={{ flex: 1 }} />
            <Button label="Library" variant="ghost" onPress={() => pick("library")} style={{ flex: 1 }} />
          </Row>
        </Card>

        {imageUri ? (
          <>
            <TextInput
              placeholder="Optional: portion hints (e.g. '2 wraps, no fries')"
              placeholderTextColor={theme.colors.muted}
              value={hint}
              onChangeText={setHint}
              style={input}
            />
            <Button
              label={loading ? "Analyzing…" : "Analyze with AI"}
              onPress={analyze}
              loading={loading}
              disabled={!dataUrl}
            />
          </>
        ) : null}

        {result ? (
          <>
            <AppText muted size={13}>{result.summary}</AppText>

            {/* Meal selector */}
            <Row style={{ gap: 8 }}>
              {MEAL_TYPES.map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setMeal(m)}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: theme.radius.sm,
                    alignItems: "center",
                    backgroundColor: meal === m ? theme.colors.accent : theme.colors.card,
                    borderWidth: 1,
                    borderColor: theme.colors.cardBorder,
                  }}
                >
                  <Text style={{ color: meal === m ? "#04140b" : theme.colors.muted, fontSize: 11, fontWeight: "700" }}>
                    {mealLabel(m)}
                  </Text>
                </Pressable>
              ))}
            </Row>

            {items.map((it, i) => (
              <Pressable key={i} onPress={() => toggle(i)}>
                <Card style={{ paddingVertical: 12, opacity: it.include ? 1 : 0.45 }}>
                  <Row style={{ justifyContent: "space-between" }}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Row style={{ gap: 6 }}>
                        <Ionicons
                          name={it.include ? "checkmark-circle" : "ellipse-outline"}
                          size={18}
                          color={it.include ? theme.colors.accent : theme.colors.muted}
                        />
                        <AppText bold size={14} style={{ flex: 1 }}>
                          {it.name}{it.quantity ? ` · ${it.quantity}` : ""}
                        </AppText>
                      </Row>
                      <Row style={{ gap: 8, marginTop: 6, marginLeft: 24 }}>
                        <Pill label={`${Math.round(it.calories)} kcal`} color={theme.colors.calories} />
                        <AppText muted size={12}>P{Math.round(it.protein)} · C{Math.round(it.carbs)} · F{Math.round(it.fat)}</AppText>
                        {it.confidence === "low" ? <Pill label="low conf" color={theme.colors.accentWarm} /> : null}
                      </Row>
                    </View>
                  </Row>
                </Card>
              </Pressable>
            ))}

            <Card style={{ backgroundColor: `${theme.colors.accent}18`, borderColor: `${theme.colors.accent}55` }}>
              <Row style={{ justifyContent: "space-between" }}>
                <AppText bold>Total to log</AppText>
                <AppText bold color={theme.colors.accent}>{Math.round(totals.calories)} kcal</AppText>
              </Row>
              <AppText muted size={13} style={{ marginTop: 4 }}>
                P{Math.round(totals.protein)} · C{Math.round(totals.carbs)} · F{Math.round(totals.fat)} · {included.length} items
              </AppText>
            </Card>

            <Button
              label={saving ? "Saving…" : `Log ${included.length} item${included.length === 1 ? "" : "s"}`}
              onPress={save}
              loading={saving}
              disabled={!included.length}
            />
            {result.cost_usd ? (
              <AppText muted size={11} style={{ textAlign: "center" }}>
                This scan cost ~${result.cost_usd.toFixed(4)}
              </AppText>
            ) : null}
          </>
        ) : null}

        {loading && !result ? (
          <View style={{ alignItems: "center", padding: 20 }}>
            <ActivityIndicator color={theme.colors.accent} />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
