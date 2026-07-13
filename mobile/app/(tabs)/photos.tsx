import React, { useState } from "react";
import { ScrollView, View, Pressable, RefreshControl, Alert, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useQueryClient } from "@tanstack/react-query";
import { todayISO, formatDateShort } from "@shared/timezone";
import { api } from "@/api/client";
import { usePhotos } from "@/api/queries";
import { useAuth } from "@/lib/AuthContext";
import { imageUrl } from "@/lib/images";
import { Card, AppText, ScreenTitle, Row, Pill } from "@/components/ui";
import { theme } from "@/lib/theme";

const CATS = ["body", "meal", "progress"] as const;
const COL_W = (Dimensions.get("window").width - 16 * 2 - 8) / 2;

export default function Photos() {
  const { canWrite } = useAuth();
  const [cat, setCat] = useState<(typeof CATS)[number]>("body");
  const photos = usePhotos(cat);
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const list = photos.data ?? [];

  async function pick(useCamera: boolean) {
    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Enable photo/camera access in Settings.");
      return;
    }
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8, mediaTypes: ["images"] });
    if (result.canceled || !result.assets?.length) return;

    setUploading(true);
    try {
      await api.uploadPhoto(result.assets[0].uri, { date: todayISO(), category: cat });
      qc.invalidateQueries({ queryKey: ["photos", cat] });
    } catch (e) {
      Alert.alert("Upload failed", String((e as Error).message));
    } finally {
      setUploading(false);
    }
  }

  function addPhoto() {
    Alert.alert("Add photo", undefined, [
      { text: "Take photo", onPress: () => pick(true) },
      { text: "Choose from library", onPress: () => pick(false) },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={photos.isFetching} onRefresh={() => photos.refetch()} tintColor={theme.colors.accent} />}
      >
        <Row style={{ justifyContent: "space-between" }}>
          <ScreenTitle title="Photos" />
          {canWrite ? (
            <Pressable onPress={addPhoto} disabled={uploading} style={{ padding: 8 }}>
              <Ionicons name={uploading ? "cloud-upload" : "add-circle"} size={30} color={theme.colors.accent} />
            </Pressable>
          ) : null}
        </Row>

        <Row style={{ gap: 6, marginBottom: 16, backgroundColor: theme.colors.card, borderRadius: theme.radius.md, padding: 4 }}>
          {CATS.map((c) => (
            <Pressable key={c} onPress={() => setCat(c)} style={{ flex: 1, paddingVertical: 8, borderRadius: theme.radius.sm, alignItems: "center", backgroundColor: cat === c ? theme.colors.accent : "transparent" }}>
              <AppText size={13} bold color={cat === c ? "#04140b" : theme.colors.muted} style={{ textTransform: "capitalize" }}>{c}</AppText>
            </Pressable>
          ))}
        </Row>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {list.map((p) => (
            <View key={p.id} style={{ width: COL_W }}>
              <Image
                source={{ uri: imageUrl(p.filename) ?? undefined }}
                style={{ width: COL_W, height: COL_W * 1.3, borderRadius: theme.radius.md, backgroundColor: theme.colors.card }}
                contentFit="cover"
              />
              <Row style={{ justifyContent: "space-between", marginTop: 4 }}>
                <AppText muted size={11}>{formatDateShort(p.date)}</AppText>
                {p.caption ? <Pill label={p.caption} color={theme.colors.muted} /> : null}
              </Row>
            </View>
          ))}
        </View>

        {list.length === 0 ? <Card><AppText muted>No {cat} photos yet.</AppText></Card> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
