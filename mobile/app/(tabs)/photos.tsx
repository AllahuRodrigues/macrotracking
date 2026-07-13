import React, { useState } from "react";
import { ScrollView, View, Pressable, RefreshControl, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useQueryClient } from "@tanstack/react-query";
import { formatDateShort, todayISO } from "@shared/timezone";
import { usePhotos } from "@/api/queries";
import { useAuth } from "@/lib/AuthContext";
import { imageUrl } from "@/lib/images";
import { Card, AppText, ScreenTitle, Row, Pill } from "@/components/ui";
import { QuickLogBar, PhotoModal } from "@/components/QuickLog";
import { ImageViewer, type ViewerPhoto } from "@/components/ImageViewer";
import { theme } from "@/lib/theme";

const CATS = ["body", "meal", "progress"] as const;
const COL_W = (Dimensions.get("window").width - 16 * 2 - 8) / 2;

export default function Photos({ embedded = false }: { embedded?: boolean }) {
  const { canWrite } = useAuth();
  const [cat, setCat] = useState<(typeof CATS)[number]>("body");
  const photos = usePhotos(cat);
  const qc = useQueryClient();
  const [photoOpen, setPhotoOpen] = useState(false);
  const [viewerIdx, setViewerIdx] = useState<number | null>(null);
  const list = photos.data ?? [];
  const viewerPhotos: ViewerPhoto[] = list.map((p) => ({
    id: p.id,
    filename: p.filename,
    date: p.date,
    caption: p.caption,
    category: p.category,
  }));

  const body = (
    <>
      {!embedded ? <ScreenTitle title="Photos" subtitle="Tap a photo to open full screen" /> : null}
      {embedded ? (
        <AppText muted size={13} style={{ marginBottom: 10 }}>
          Tap any photo to open · swipe Prev/Next
        </AppText>
      ) : null}

      {canWrite ? <QuickLogBar date={todayISO()} /> : null}

      <Row
        style={{
          gap: 6,
          marginBottom: 16,
          backgroundColor: theme.colors.card,
          borderRadius: theme.radius.md,
          padding: 4,
        }}
      >
        {CATS.map((c) => (
          <Pressable
            key={c}
            onPress={() => setCat(c)}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: theme.radius.sm,
              alignItems: "center",
              backgroundColor: cat === c ? theme.colors.accent : "transparent",
            }}
          >
            <AppText
              size={13}
              bold
              color={cat === c ? "#04140b" : theme.colors.muted}
              style={{ textTransform: "capitalize" }}
            >
              {c}
            </AppText>
          </Pressable>
        ))}
      </Row>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {list.map((p, idx) => {
          const uri = imageUrl(p.filename);
          return (
            <Pressable
              key={p.id}
              onPress={() => setViewerIdx(idx)}
              style={{ width: COL_W }}
              accessibilityLabel={`Open photo from ${p.date}`}
            >
              <Image
                source={{ uri: uri ?? undefined }}
                style={{
                  width: COL_W,
                  height: COL_W * 1.3,
                  borderRadius: theme.radius.md,
                  backgroundColor: theme.colors.card,
                }}
                contentFit="cover"
              />
              <Row style={{ justifyContent: "space-between", marginTop: 4 }}>
                <AppText muted size={11}>
                  {formatDateShort(p.date)}
                </AppText>
                {p.caption ? <Pill label={p.caption} color={theme.colors.muted} /> : null}
              </Row>
            </Pressable>
          );
        })}
      </View>

      {list.length === 0 ? (
        <Card>
          <AppText muted>No {cat} photos yet. Tap Photo above to add one.</AppText>
          {canWrite ? (
            <Pressable onPress={() => setPhotoOpen(true)} style={{ marginTop: 10 }}>
              <AppText bold color={theme.colors.accent}>
                Add {cat} photo →
              </AppText>
            </Pressable>
          ) : null}
        </Card>
      ) : null}

      <PhotoModal
        visible={photoOpen}
        date={todayISO()}
        onClose={() => {
          setPhotoOpen(false);
          qc.invalidateQueries({ queryKey: ["photos"] });
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
            refreshing={photos.isFetching}
            onRefresh={() => photos.refetch()}
            tintColor={theme.colors.accent}
          />
        }
      >
        {body}
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={photos.isFetching}
            onRefresh={() => photos.refetch()}
            tintColor={theme.colors.accent}
          />
        }
      >
        {body}
      </ScrollView>
    </SafeAreaView>
  );
}
