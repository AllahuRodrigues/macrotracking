import { addDays, differenceInCalendarDays, getDay, subDays } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

/** San Francisco / Pacific Time */
export const APP_TIMEZONE = "America/Los_Angeles";
export const APP_TIMEZONE_LABEL = "Pacific (SF)";

/** Current instant as a Date adjusted for SF wall-clock context */
export function nowInAppTz(): Date {
  return toZonedTime(new Date(), APP_TIMEZONE);
}

/** Today's calendar date in SF as YYYY-MM-DD */
export function todayISO(): string {
  return formatInTimeZone(new Date(), APP_TIMEZONE, "yyyy-MM-dd");
}

/** Convert YYYY-MM-DD to a Date at noon SF (safe for calendar math) */
export function parseDateISO(iso: string): Date {
  return fromZonedTime(`${iso} 12:00:00`, APP_TIMEZONE);
}

/** Format YYYY-MM-DD for display in SF */
export function formatDateLong(iso: string): string {
  return formatInTimeZone(parseDateISO(iso), APP_TIMEZONE, "EEEE, MMMM d, yyyy");
}

export function formatDateMedium(iso: string): string {
  return formatInTimeZone(parseDateISO(iso), APP_TIMEZONE, "EEE, MMM d, yyyy");
}

export function formatDateShort(iso: string): string {
  return formatInTimeZone(parseDateISO(iso), APP_TIMEZONE, "MMM d");
}

export function formatWeekday(iso: string): string {
  return formatInTimeZone(parseDateISO(iso), APP_TIMEZONE, "EEE");
}

export function formatDayNum(iso: string): string {
  return formatInTimeZone(parseDateISO(iso), APP_TIMEZONE, "d");
}

/** Shift a calendar date by N days in SF */
export function shiftDateISO(iso: string, days: number): string {
  return formatInTimeZone(addDays(parseDateISO(iso), days), APP_TIMEZONE, "yyyy-MM-dd");
}

export function subDaysISO(iso: string, days: number): string {
  return formatInTimeZone(subDays(parseDateISO(iso), days), APP_TIMEZONE, "yyyy-MM-dd");
}

export function isTodayISO(iso: string): boolean {
  return iso === todayISO();
}

/** Day of week in SF: 0 = Sunday … 6 = Saturday */
export function weekdayIndexISO(iso: string): number {
  return getDay(toZonedTime(parseDateISO(iso), APP_TIMEZONE));
}

/** Calendar days from `fromISO` to `toISO` in SF */
export function daysBetweenISO(fromISO: string, toISO: string): number {
  return differenceInCalendarDays(parseDateISO(toISO), parseDateISO(fromISO));
}

/** DayPicker selection → YYYY-MM-DD in SF */
export function calendarDateToISO(date: Date): string {
  return formatInTimeZone(date, APP_TIMEZONE, "yyyy-MM-dd");
}

export function dateISOToCalendarDate(iso: string): Date {
  return parseDateISO(iso);
}
