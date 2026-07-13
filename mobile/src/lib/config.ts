import Constants from "expo-constants";

/**
 * Base URL for the MacroTrack API (the deployed Next.js app).
 * Override at build time via app.json → expo.extra.apiBaseUrl,
 * or at runtime in dev via EXPO_PUBLIC_API_BASE_URL.
 */
export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  "https://macrotracking-coral.vercel.app";

export const APP_NAME = "MacroTrack";
