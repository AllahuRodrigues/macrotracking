import React, { useState } from "react";
import {
  Modal,
  View,
  Pressable,
  Dimensions,
  StatusBar,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatDateMedium } from "@shared/timezone";
import { imageUrl } from "@/lib/images";
import { AppText } from "@/components/ui";
import { theme } from "@/lib/theme";

export type ViewerPhoto = {
  id: string;
  filename: string;
  date: string;
  caption?: string | null;
  category?: string;
};

type Props = {
  photos: ViewerPhoto[];
  index: number;
  visible: boolean;
  onClose: () => void;
};

const { width: W, height: H } = Dimensions.get("window");

/** Fullscreen photo viewer — swipe via prev/next, tap X to close. */
export function ImageViewer({ photos, index, visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [i, setI] = useState(index);

  // Sync when opening a different thumb
  React.useEffect(() => {
    if (visible) setI(index);
  }, [visible, index]);

  const photo = photos[i];
  const uri = photo ? imageUrl(photo.filename) : null;
  const canPrev = i > 0;
  const canNext = i < photos.length - 1;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.root}>
        <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
          <View style={{ flex: 1 }}>
            {photo ? (
              <>
                <AppText bold size={15} color="#fff">
                  {formatDateMedium(photo.date)}
                </AppText>
                <AppText size={12} color="rgba(255,255,255,0.65)">
                  {[photo.category, photo.caption].filter(Boolean).join(" · ") ||
                    `${i + 1} / ${photos.length}`}
                </AppText>
              </>
            ) : null}
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={styles.close}
            accessibilityLabel="Close photo"
          >
            <Ionicons name="close" size={26} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.stage}>
          {uri ? (
            <Image
              source={{ uri }}
              style={{ width: W, height: H * 0.72 }}
              contentFit="contain"
              transition={150}
            />
          ) : (
            <AppText muted>Photo unavailable</AppText>
          )}
        </View>

        <View style={[styles.nav, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            disabled={!canPrev}
            onPress={() => setI((x) => Math.max(0, x - 1))}
            style={[styles.navBtn, !canPrev && { opacity: 0.25 }]}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
            <AppText bold color="#fff" size={14}>
              Prev
            </AppText>
          </Pressable>
          <AppText color="rgba(255,255,255,0.7)" size={13}>
            {photos.length ? `${i + 1} / ${photos.length}` : "—"}
          </AppText>
          <Pressable
            disabled={!canNext}
            onPress={() => setI((x) => Math.min(photos.length - 1, x + 1))}
            style={[styles.navBtn, !canNext && { opacity: 0.25 }]}
          >
            <AppText bold color="#fff" size={14}>
              Next
            </AppText>
            <Ionicons name="chevron-forward" size={22} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  top: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  stage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 44,
    paddingHorizontal: 8,
  },
});
