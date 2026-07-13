/**
 * Apple Health / HealthKit bridge.
 * Full auto-import needs a native rebuild with HealthKit entitlements.
 * Until then, this helper opens the Health app and supports manual paste.
 */
import { Linking, Platform } from "react-native";

export async function openAppleHealth(): Promise<void> {
  if (Platform.OS !== "ios") return;
  const url = "x-apple-health://";
  if (await Linking.canOpenURL(url)) {
    await Linking.openURL(url);
  } else {
    await Linking.openURL("https://www.apple.com/ios/health/");
  }
}

/** Placeholder for future HealthKit reads after Xcode entitlements. */
export async function readTodayFromHealthKit(): Promise<{
  steps?: number;
  sleepHours?: number;
} | null> {
  // Native HealthKit module not bundled in Expo Go.
  // After `npx expo prebuild` + HealthKit capability, wire
  // `@kingstinct/react-native-healthkit` here.
  return null;
}
