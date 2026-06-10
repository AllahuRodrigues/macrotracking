import { differenceInCalendarDays } from "date-fns";
import { formatDateMedium, parseDateISO, todayISO } from "./timezone";

/** Cut / recomp photo journey end date */
export const JOURNEY_END_ISO = "2026-08-01";
export const JOURNEY_START_ISO = "2026-06-02";

export const JOURNEY_GOAL_WEIGHT_LBS = 174;
export const JOURNEY_START_WEIGHT_LBS = 189;
/** Latest InBody reading — updated 06/09/2026 */
export const JOURNEY_LATEST_WEIGHT_LBS = 187.6;
export const JOURNEY_LATEST_DATE_ISO = "2026-06-09";
/** User-reported body fat % (separate measurement method) */
export const JOURNEY_CURRENT_BF_PCT = 32;
/** InBody 580 bioimpedance BF% reading */
export const JOURNEY_INBODY_BF_PCT = 19.9;

export const POSE_ORDER = ["front", "side", "back"] as const;
export type BodyPose = (typeof POSE_ORDER)[number] | "other";

export function inferPoseFromCaption(caption?: string): BodyPose {
  const c = (caption ?? "").toLowerCase();
  if (c.includes("back")) return "back";
  if (c.includes("side")) return "side";
  if (c.includes("front")) return "front";
  return "other";
}

export function daysUntilJourneyEnd(fromISO = todayISO()): number {
  return Math.max(0, differenceInCalendarDays(parseDateISO(JOURNEY_END_ISO), parseDateISO(fromISO)));
}

export function journeyProgressPct(fromISO = todayISO()): number {
  const total = differenceInCalendarDays(
    parseDateISO(JOURNEY_END_ISO),
    parseDateISO(JOURNEY_START_ISO)
  );
  if (total <= 0) return 100;
  const elapsed = differenceInCalendarDays(parseDateISO(fromISO), parseDateISO(JOURNEY_START_ISO));
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

export function formatJourneyDate(iso: string): string {
  return formatDateMedium(iso);
}
