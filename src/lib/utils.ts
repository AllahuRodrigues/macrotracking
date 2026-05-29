export {
  APP_TIMEZONE,
  APP_TIMEZONE_LABEL,
  todayISO,
  nowInAppTz,
  parseDateISO,
  formatDateLong,
  formatDateMedium,
  formatDateShort,
  formatWeekday,
  formatDayNum,
  shiftDateISO,
  subDaysISO,
  isTodayISO,
  weekdayIndexISO,
  daysBetweenISO,
  calendarDateToISO,
  dateISOToCalendarDate,
} from "./timezone";

export function formatNumber(n: number, decimals = 0): string {
  return n.toFixed(decimals);
}

export function pct(current: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(100, Math.round((current / goal) * 100));
}

export function mealLabel(meal: string): string {
  return meal.charAt(0).toUpperCase() + meal.slice(1);
}

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export const PHOTO_CATEGORIES = ["meal", "body", "progress"] as const;

export const MACRO_COLORS = {
  calories: "#8b7355",
  protein: "#748873",
  fat: "#D1A980",
  carbs: "#5f6f5e",
} as const;
