import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";
import { planDayFor } from "@shared/plan";

const PREFS_KEY = "macro_reminder_prefs_v2";

type NotificationsModule = typeof import("expo-notifications");

let notificationsMod: NotificationsModule | null | undefined;

/**
 * Lazy-load notifications. Stale Xcode builds lack ExpoPushTokenManager —
 * never top-level import expo-notifications or the whole app crashes.
 */
function getNotifications(): NotificationsModule | null {
  if (notificationsMod !== undefined) return notificationsMod;

  if (!requireOptionalNativeModule("ExpoPushTokenManager")) {
    notificationsMod = null;
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Notifications = require("expo-notifications") as NotificationsModule;
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    notificationsMod = Notifications;
  } catch {
    notificationsMod = null;
  }
  return notificationsMod;
}

export function isNotificationsAvailable(): boolean {
  return getNotifications() != null;
}

export type ReminderPrefs = {
  enabled: boolean;
  workout: boolean;
  workoutHour: number;
  workoutMinute: number;
  weighIn: boolean;
  shakes: boolean;
  logDinner: boolean;
  water: boolean;
  sauna: boolean;
  steps: boolean;
  supplements: boolean;
  proteinCheck: boolean;
};

export const DEFAULT_PREFS: ReminderPrefs = {
  enabled: false,
  workout: true,
  workoutHour: 16,
  workoutMinute: 0,
  weighIn: true,
  shakes: true,
  logDinner: true,
  water: true,
  sauna: true,
  steps: true,
  supplements: true,
  proteinCheck: true,
};

export async function loadPrefs(): Promise<ReminderPrefs> {
  try {
    const raw = await SecureStore.getItemAsync(PREFS_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
    const old = await SecureStore.getItemAsync("macro_reminder_prefs");
    if (old) {
      const parsed = { ...DEFAULT_PREFS, ...JSON.parse(old), enabled: true };
      await savePrefs(parsed);
      return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_PREFS;
}

async function savePrefs(prefs: ReminderPrefs): Promise<void> {
  await SecureStore.setItemAsync(PREFS_KEY, JSON.stringify(prefs));
}

export async function ensurePermission(): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "MacroTrack Reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#4ade80",
    });
  }
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const req = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return req.granted;
}

async function daily(
  Notifications: NotificationsModule,
  hour: number,
  minute: number,
  title: string,
  body: string
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

async function weekly(
  Notifications: NotificationsModule,
  weekday: number,
  hour: number,
  minute: number,
  title: string,
  body: string
) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday,
      hour,
      minute,
    },
  });
}

/** Rebuild all scheduled local notifications from prefs. */
export async function applyReminders(prefs: ReminderPrefs): Promise<number> {
  await savePrefs(prefs);
  const Notifications = getNotifications();
  if (!Notifications) return 0;

  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!prefs.enabled) return 0;

  let count = 0;

  if (prefs.weighIn) {
    await daily(
      Notifications,
      7,
      0,
      "Morning weigh-in ⚖️",
      "After bathroom — log weight in MacroTrack. Judge the 7-day trend."
    );
    count++;
  }

  if (prefs.shakes) {
    await daily(Notifications, 7, 30, "Shake 1 🥤", "1 scoop whey + 200 mL milk (~35g protein). Breakfast block.");
    await daily(Notifications, 12, 0, "Shake 2 🥤", "Midday protein — stay on the 140g protocol.");
    await daily(Notifications, 17, 0, "Shake 3 🥤", "Post-training or pre-workout fuel.");
    await daily(Notifications, 21, 0, "Shake 4 🥤", "Evening protein to close the day.");
    count += 4;
  }

  if (prefs.supplements) {
    await daily(Notifications, 8, 15, "Morning supps ☀️", "Creatine 5g, D3+K2, omega-3 — tap to log.");
    await daily(Notifications, 21, 45, "Evening supps 🌙", "Magnesium glycinate + B6 for sleep & recovery.");
    count += 2;
  }

  if (prefs.water) {
    await daily(Notifications, 10, 0, "Hydrate 💧", "Target 3–4 L today. Log water in the app.");
    await daily(Notifications, 14, 30, "Water check 💧", "Halfway through the day — how much logged?");
    await daily(Notifications, 18, 0, "Water check 💧", "Push toward 4 L before bed.");
    count += 3;
  }

  if (prefs.proteinCheck) {
    await daily(Notifications, 20, 0, "Protein check 🎯", "200g target — log anything missing before bed.");
    count++;
  }

  if (prefs.logDinner) {
    await daily(Notifications, 20, 30, "Log your food 📝", "Did you log dinner? Consistency beats perfection.");
    count++;
  }

  if (prefs.workout) {
    const today = planDayFor(new Date().getDay());
    await daily(
      Notifications,
      prefs.workoutHour,
      prefs.workoutMinute,
      "Time to train 💪",
      `${today.title.split("—")[1]?.trim() ?? today.focus}. 3–4 h block — compounds 1–2 RIR.`
    );
    count++;
  }

  if (prefs.steps) {
    await daily(Notifications, 19, 0, "Steps check 🚶", "12,000–15,000 steps today. Check Health app & keep moving.");
    count++;
  }

  if (prefs.sauna) {
    await weekly(Notifications, 4, 18, 30, "Sauna 🔥", "30 min sauna — recovery, not fat loss. Hydrate.");
    await weekly(Notifications, 1, 18, 30, "Sauna 🔥", "Second sauna this week. 30 min max.");
    count += 2;
  }

  return count;
}

/** One-time welcome nudge after permissions granted. */
export async function sendWelcomeNotification(): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "MacroTrack reminders on ✅",
      body: "You'll get workout, shake, water & logging nudges. Toggle any time under You → Reminders.",
      sound: true,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3 },
  });
}

export async function scheduledCount(): Promise<number> {
  const Notifications = getNotifications();
  if (!Notifications) return 0;
  return (await Notifications.getAllScheduledNotificationsAsync()).length;
}

/** Optional tap-handler for notification opens (no-op if native module missing). */
export function addNotificationResponseListener(
  handler: (screen?: string) => void
): { remove: () => void } {
  const Notifications = getNotifications();
  if (!Notifications) return { remove: () => undefined };
  const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
    const data = resp.notification.request.content.data as { screen?: string } | undefined;
    handler(data?.screen);
  });
  return sub;
}
