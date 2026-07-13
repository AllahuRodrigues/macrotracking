import React, { useState } from "react";
import {
  View,
  Modal,
  Pressable,
  TextInput,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useQueryClient } from "@tanstack/react-query";
import { todayISO } from "@shared/timezone";
import type { BodyMetric, PhotoCategory } from "@shared/types";
import { api } from "@/api/client";
import { Card, AppText, Row, Button, Pill } from "@/components/ui";
import { theme } from "@/lib/theme";

type Mode = "menu" | "weigh" | "inbody" | "photo" | null;

const inputStyle = {
  backgroundColor: theme.colors.card,
  borderColor: theme.colors.cardBorder,
  borderWidth: 1,
  borderRadius: theme.radius.md,
  color: theme.colors.foreground,
  padding: 12,
  fontSize: 15,
} as const;

/** Home / Progress quick actions: weigh-in, InBody, photo. */
export function QuickLogBar({ date = todayISO() }: { date?: string }) {
  const [mode, setMode] = useState<Mode>(null);

  return (
    <>
      <Row style={{ gap: 8, marginBottom: 14 }}>
        <QuickBtn
          icon="scale"
          label="Weigh-in"
          color={theme.colors.accent}
          onPress={() => setMode("weigh")}
        />
        <QuickBtn
          icon="fitness"
          label="InBody"
          color={theme.colors.blue}
          onPress={() => setMode("inbody")}
        />
        <QuickBtn
          icon="camera"
          label="Photo"
          color={theme.colors.accentWarm}
          onPress={() => setMode("photo")}
        />
      </Row>

      <WeighModal
        visible={mode === "weigh"}
        date={date}
        onClose={() => setMode(null)}
      />
      <InBodyModal
        visible={mode === "inbody"}
        date={date}
        onClose={() => setMode(null)}
      />
      <PhotoModal
        visible={mode === "photo"}
        date={date}
        onClose={() => setMode(null)}
      />
    </>
  );
}

function QuickBtn({
  icon,
  label,
  color,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: `${color}18`,
        borderColor: `${color}44`,
        borderWidth: 1,
        borderRadius: theme.radius.md,
        paddingVertical: 14,
        alignItems: "center",
        gap: 4,
      }}
    >
      <Ionicons name={icon} size={22} color={color} />
      <AppText bold size={12} color={color}>
        {label}
      </AppText>
    </Pressable>
  );
}

function Sheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "#000a" }}>
        <View
          style={{
            backgroundColor: theme.colors.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 20,
            maxHeight: "88%",
          }}
        >
          <Row style={{ justifyContent: "space-between", marginBottom: 14 }}>
            <AppText bold size={18}>
              {title}
            </AppText>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={theme.colors.muted} />
            </Pressable>
          </Row>
          <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  keyboardType = "decimal-pad",
}: {
  label: string;
  value: string;
  onChange: (t: string) => void;
  placeholder?: string;
  keyboardType?: "decimal-pad" | "default" | "number-pad";
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      <AppText muted size={11} style={{ marginBottom: 4 }}>
        {label}
      </AppText>
      <TextInput
        style={inputStyle}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.muted}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  );
}

function WeighModal({
  visible,
  date,
  onClose,
}: {
  visible: boolean;
  date: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [w, setW] = useState("");
  const [bf, setBf] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!w) {
      Alert.alert("Weight needed");
      return;
    }
    setSaving(true);
    try {
      await api.createBody({
        date,
        weight_lbs: parseFloat(w),
        body_fat_pct: bf ? parseFloat(bf) : undefined,
        notes: "Morning weigh-in",
      });
      qc.invalidateQueries({ queryKey: ["body"] });
      qc.invalidateQueries({ queryKey: ["insights"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setW("");
      setBf("");
      onClose();
    } catch (e) {
      Alert.alert("Save failed", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet visible={visible} title="Morning weigh-in" onClose={onClose}>
      <Field label="Weight (lb)" value={w} onChange={setW} placeholder="188" />
      <Field label="Body fat % (optional)" value={bf} onChange={setBf} placeholder="30" />
      <Button label={saving ? "Saving…" : "Save weigh-in"} onPress={save} loading={saving} />
    </Sheet>
  );
}

function InBodyModal({
  visible,
  date,
  onClose,
}: {
  visible: boolean;
  date: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [f, setF] = useState({
    date,
    weight_lbs: "",
    body_fat_pct: "",
    muscle_mass_lbs: "",
    skeletal_muscle_lbs: "",
    bmi: "",
    visceral_fat: "",
    inbody_score: "",
    body_water_pct: "",
    bmr: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setF((prev) => ({ ...prev, [k]: v }));

  const save = async () => {
    if (!f.weight_lbs) {
      Alert.alert("Weight needed", "Enter at least weight from the InBody printout.");
      return;
    }
    setSaving(true);
    try {
      const num = (s: string) => (s ? parseFloat(s) : undefined);
      await api.createBody({
        date: f.date || date,
        weight_lbs: num(f.weight_lbs),
        body_fat_pct: num(f.body_fat_pct),
        muscle_mass_lbs: num(f.muscle_mass_lbs),
        skeletal_muscle_lbs: num(f.skeletal_muscle_lbs),
        bmi: num(f.bmi),
        visceral_fat: num(f.visceral_fat),
        inbody_score: num(f.inbody_score),
        body_water_pct: num(f.body_water_pct),
        bmr: num(f.bmr),
        notes: f.notes || `InBody scan — ${f.date || date}`,
      });
      qc.invalidateQueries({ queryKey: ["body"] });
      qc.invalidateQueries({ queryKey: ["insights"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (e) {
      Alert.alert("Save failed", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet visible={visible} title="Log InBody scan" onClose={onClose}>
      <AppText muted size={12} style={{ marginBottom: 10 }}>
        Copy numbers from your InBody 580 printout / app. Leave blanks if unknown.
      </AppText>
      <Field label="Scan date (YYYY-MM-DD)" value={f.date} onChange={(v) => set("date", v)} placeholder={date} keyboardType="default" />
      <Row style={{ gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Field label="Weight lb" value={f.weight_lbs} onChange={(v) => set("weight_lbs", v)} placeholder="187.6" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="InBody BF %" value={f.body_fat_pct} onChange={(v) => set("body_fat_pct", v)} placeholder="19.9" />
        </View>
      </Row>
      <Row style={{ gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Field label="SMM lb" value={f.skeletal_muscle_lbs} onChange={(v) => set("skeletal_muscle_lbs", v)} placeholder="86.9" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Muscle mass lb" value={f.muscle_mass_lbs} onChange={(v) => set("muscle_mass_lbs", v)} placeholder="86.9" />
        </View>
      </Row>
      <Row style={{ gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Field label="Score" value={f.inbody_score} onChange={(v) => set("inbody_score", v)} placeholder="90" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="BMI" value={f.bmi} onChange={(v) => set("bmi", v)} placeholder="29.8" />
        </View>
      </Row>
      <Row style={{ gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Field label="Visceral (cm²)" value={f.visceral_fat} onChange={(v) => set("visceral_fat", v)} placeholder="68.2" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="BMR" value={f.bmr} onChange={(v) => set("bmr", v)} placeholder="1843" />
        </View>
      </Row>
      <Field label="Body water %" value={f.body_water_pct} onChange={(v) => set("body_water_pct", v)} placeholder="73.2" />
      <View style={{ marginBottom: 10 }}>
        <AppText muted size={11} style={{ marginBottom: 4 }}>
          Notes
        </AppText>
        <TextInput
          style={[inputStyle, { minHeight: 60 }]}
          value={f.notes}
          onChangeText={(v) => set("notes", v)}
          placeholder="Phase angle, FFMI, etc."
          placeholderTextColor={theme.colors.muted}
          multiline
        />
      </View>
      <Button label={saving ? "Saving…" : "Save InBody reading"} onPress={save} loading={saving} />
    </Sheet>
  );
}

function PhotoModal({
  visible,
  date,
  onClose,
}: {
  visible: boolean;
  date: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [uri, setUri] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState<PhotoCategory>("body");
  const [uploading, setUploading] = useState(false);

  const pick = async (camera: boolean) => {
    const perm = camera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed");
      return;
    }
    const res = camera
      ? await ImagePicker.launchCameraAsync({ quality: 0.85, allowsEditing: true })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.85, mediaTypes: ["images"], allowsEditing: true });
    if (!res.canceled && res.assets[0]) setUri(res.assets[0].uri);
  };

  const upload = async () => {
    if (!uri) return;
    setUploading(true);
    try {
      await api.uploadPhoto(uri, {
        date,
        category,
        caption: caption.trim() || undefined,
      });
      qc.invalidateQueries({ queryKey: ["photos"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setUri(null);
      setCaption("");
      onClose();
    } catch (e) {
      Alert.alert("Upload failed", (e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Sheet visible={visible} title="Add progress photo" onClose={onClose}>
      <Row style={{ gap: 8, marginBottom: 12 }}>
        {(["body", "progress", "meal"] as PhotoCategory[]).map((c) => (
          <Pressable
            key={c}
            onPress={() => setCategory(c)}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: theme.radius.sm,
              alignItems: "center",
              backgroundColor: category === c ? theme.colors.accent : theme.colors.card,
              borderWidth: 1,
              borderColor: theme.colors.cardBorder,
            }}
          >
            <AppText size={12} bold color={category === c ? "#04140b" : theme.colors.muted}>
              {c}
            </AppText>
          </Pressable>
        ))}
      </Row>

      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: "100%", height: 220, borderRadius: theme.radius.md, marginBottom: 12 }}
          resizeMode="cover"
        />
      ) : (
        <Card style={{ alignItems: "center", paddingVertical: 28, marginBottom: 12 }}>
          <Ionicons name="image-outline" size={40} color={theme.colors.muted} />
          <AppText muted size={13} style={{ marginTop: 8 }}>
            Take or choose a photo
          </AppText>
        </Card>
      )}

      <Row style={{ gap: 8, marginBottom: 12 }}>
        <Button label="Camera" variant="ghost" onPress={() => pick(true)} style={{ flex: 1 }} />
        <Button label="Library" variant="ghost" onPress={() => pick(false)} style={{ flex: 1 }} />
      </Row>

      <TextInput
        style={[inputStyle, { marginBottom: 12 }]}
        value={caption}
        onChangeText={setCaption}
        placeholder="Caption (front / side / back…)"
        placeholderTextColor={theme.colors.muted}
      />

      <Button
        label={uploading ? "Uploading…" : "Save photo"}
        onPress={upload}
        loading={uploading}
        disabled={!uri}
      />
    </Sheet>
  );
}

/** Re-export InBody modal for Body tab */
export { InBodyModal, WeighModal, PhotoModal };
