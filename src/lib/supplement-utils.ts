import type { Supplement, SupplementFrequency } from "./types";

export function getTimingSlot(timing?: string): string {
  const t = (timing ?? "").toLowerCase();
  if (t.includes("pre-workout") || t.includes("before training")) return "Pre-Workout";
  if (t.includes("post-workout") || t.includes("after training")) return "Post-Workout";
  if (t.includes("bed") || t.includes("before sleep") || t.includes("pre-bed")) return "Before Bed";
  if (t.includes("morning") || t.includes("breakfast")) return "Morning";
  if (t.includes("snack") || t.includes("any time") || t.includes("as needed")) return "Anytime";
  if (t.includes("evening")) return "Evening";
  return "Daily";
}

export const TIMING_ORDER = [
  "Morning",
  "Pre-Workout",
  "Post-Workout",
  "Anytime",
  "Evening",
  "Before Bed",
  "Daily",
];

export const TIMING_ICONS: Record<string, string> = {
  Morning: "🌅",
  "Pre-Workout": "💪",
  "Post-Workout": "🥤",
  Anytime: "🍫",
  Evening: "🌆",
  "Before Bed": "🌙",
  Daily: "💊",
};

export function isSupplementDueToday(
  frequency: SupplementFrequency | string | undefined,
  date: string,
  startDate = "2026-05-28"
): boolean {
  if (!frequency || frequency === "daily") return true;
  const d1 = new Date(date + "T12:00:00").getTime();
  const d0 = new Date(startDate + "T12:00:00").getTime();
  const days = Math.floor((d1 - d0) / 86400000);
  if (frequency === "every_2_days") return days % 2 === 0;
  if (frequency === "weekly") return days % 7 === 0;
  return true;
}

export function filterDueSupplements<T extends { frequency?: string }>(
  supplements: T[],
  date: string
): T[] {
  return supplements.filter((s) => isSupplementDueToday(s.frequency, date));
}

export function groupSupplementsByTiming(supplements: Supplement[]) {
  const groups: Record<string, Supplement[]> = {};
  for (const s of supplements) {
    const slot = getTimingSlot(s.timing);
    if (!groups[slot]) groups[slot] = [];
    groups[slot].push(s);
  }
  return TIMING_ORDER.filter((k) => groups[k]?.length).map((k) => ({
    slot: k,
    icon: TIMING_ICONS[k] ?? "💊",
    supplements: groups[k],
  }));
}
