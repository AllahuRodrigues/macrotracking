/**
 * Daily rituals — appearance, hygiene, habits (no Zyns), muscle & fat goals.
 * Shared by web + mobile. Checklist state is stored locally per date.
 */

export type RitualCategory =
  | "muscle"
  | "face"
  | "oral"
  | "eyes"
  | "scent"
  | "habits"
  | "kit";

export type RitualItem = {
  id: string;
  category: RitualCategory;
  title: string;
  detail: string;
  /** Shown in today's checkbox list */
  daily: boolean;
};

export const RITUAL_CATEGORY_META: Record<
  RitualCategory,
  { label: string; blurb: string }
> = {
  muscle: {
    label: "Muscle & fat",
    blurb: "More muscle, less trunk fat — the cut does the heavy lifting.",
  },
  face: {
    label: "Face & glow",
    blurb: "Skin, hairline, beard line — clean and consistent beats 10 products.",
  },
  oral: {
    label: "Gums & teeth",
    blurb: "Smile, breath, gum health — non-negotiable.",
  },
  eyes: {
    label: "Eyes",
    blurb: "Clear eyes read as healthy and sharp.",
  },
  scent: {
    label: "Smell & presence",
    blurb: "You should smell clean from arm's length — never loud.",
  },
  habits: {
    label: "Hard rules",
    blurb: "No Zyns. Sleep, posture, and discipline compound.",
  },
  kit: {
    label: "Things to have",
    blurb: "Keep these stocked so rituals are automatic.",
  },
};

export const HARD_RULES = [
  "No Zyns / nicotine pouches — ever. Nicotine hits vessels, gums, sleep, and recovery.",
  "No smoke / vape. Same reasons.",
  "No crash diets under 2,000 kcal — kills muscle, hormones, and face fullness.",
  "Judge weight on a 7-day average, not one morning.",
] as const;

/** Daily checklist — short taps. */
export const DAILY_RITUALS: RitualItem[] = [
  {
    id: "pushups_am",
    category: "muscle",
    title: "Morning push-ups",
    detail: "3–5 sets of as many clean reps as possible — chest to floor, full lockout. Builds pressing endurance + morning wake-up.",
    daily: true,
  },
  {
    id: "pushups_pm",
    category: "muscle",
    title: "Evening push-up finisher",
    detail: "2–3 hard sets before bed (not to failure if shoulders are fried from Push day).",
    daily: true,
  },
  {
    id: "posture",
    category: "muscle",
    title: "Posture resets",
    detail: "3× today: ribs down, chin tucked, shoulders back 20 seconds. Phone held at eye level.",
    daily: true,
  },
  {
    id: "steps_ritual",
    category: "muscle",
    title: "Steps on track",
    detail: "12–15k. Fat leaves the trunk when the deficit + steps are boringly consistent.",
    daily: true,
  },
  {
    id: "face_am",
    category: "face",
    title: "AM face wash + moisturizer + SPF",
    detail: "Gentle cleanse → moisturizer → SPF 30+ every morning (even indoors near windows).",
    daily: true,
  },
  {
    id: "face_pm",
    category: "face",
    title: "PM cleanse + moisturizer",
    detail: "Wash off sweat/oil/SPF. Light moisturizer. No picking.",
    daily: true,
  },
  {
    id: "lips_brows",
    category: "face",
    title: "Grooming check",
    detail: "Beard/neckline clean, brows tidy, nose/ear hair checked, nails short & clean.",
    daily: true,
  },
  {
    id: "brush_am",
    category: "oral",
    title: "Brush + tongue scrape (AM)",
    detail: "2 minutes. Soft brush. Scrape tongue front → back.",
    daily: true,
  },
  {
    id: "floss",
    category: "oral",
    title: "Floss / water floss",
    detail: "Once daily minimum — gums first, whitening second.",
    daily: true,
  },
  {
    id: "brush_pm",
    category: "oral",
    title: "Brush (PM) + mouthwash",
    detail: "Alcohol-free rinse if you use one. No food after final brush.",
    daily: true,
  },
  {
    id: "eyes",
    category: "eyes",
    title: "Eyes reset",
    detail: "Blink breaks on screens. Saline / lubricating drops if dry. 20-20-20 rule.",
    daily: true,
  },
  {
    id: "shower_scent",
    category: "scent",
    title: "Shower + clean clothes",
    detail: "Fresh tee after training. Antiperspirant. Light cologne on pulse points only — 1–2 sprays.",
    daily: true,
  },
  {
    id: "breath",
    category: "scent",
    title: "Breath check",
    detail: "Mints / gum after coffee or meals when you're around people. Floss beats spray.",
    daily: true,
  },
  {
    id: "no_zyn",
    category: "habits",
    title: "Zero Zyns today",
    detail: "If cravings hit: water, gum, walk, cold shower. Do not bargain.",
    daily: true,
  },
  {
    id: "sleep_wind",
    category: "habits",
    title: "Sleep window",
    detail: "Aim 7.5–9 h. Screens dim 45 min before bed. Same bedtime when possible.",
    daily: true,
  },
];

/** Longer reference — not every item is a daily checkbox. */
export const RITUAL_PLAYBOOK: RitualItem[] = [
  ...DAILY_RITUALS,
  {
    id: "lifemax",
    category: "habits",
    title: "Lifemax basics",
    detail:
      "Train hard, eat protein, sleep, show up on time, money in motion, phone away in social settings. Boring competence > aesthetics-only obsession.",
    daily: false,
  },
  {
    id: "glowmax",
    category: "face",
    title: "Glow stack",
    detail:
      "SPF daily, consistent sleep, lower body-fat reveals jaw/cheek structure, stay hydrated, go easy on alcohol (you're already off it for the cut).",
    daily: false,
  },
  {
    id: "facemax",
    category: "face",
    title: "Face framing",
    detail:
      "Haircut every 3–4 weeks, clean fade/lineup if that's your look, moisturizer + SPF, lose trunk fat for sharper jaw. Meving/chewing gimmicks — skip.",
    daily: false,
  },
  {
    id: "ppmax",
    category: "habits",
    title: "Circulation & no nicotine",
    detail:
      "Fat loss + cardio + sleep + zero Zyns/nicotine supports vascular health. No pumps, pills, or sketchy protocols — keep it real.",
    daily: false,
  },
  {
    id: "fat_removal",
    category: "muscle",
    title: "Fat removal (real way)",
    detail:
      "Deficit + 200g protein + lifting + 12–15k steps. Trunk fat is last to go — stay patient through Aug 14. No spot reduction.",
    daily: false,
  },
  {
    id: "more_muscle",
    category: "muscle",
    title: "More muscle",
    detail:
      "Progressive overload on Push/Pull/Legs, creatine 5g, sleep, don't under-eat below ~2,000 kcal. Keep 86.9 lb SMM — grow if you can.",
    daily: false,
  },
];

export const GEAR_LIST: { item: string; why: string }[] = [
  { item: "Soft toothbrush + floss / water flosser", why: "Gums & breath" },
  { item: "Tongue scraper", why: "Morning breath" },
  { item: "Alcohol-free mouthwash", why: "Optional rinse — less dry mouth" },
  { item: "Gentle face cleanser + moisturizer", why: "AM/PM face" },
  { item: "SPF 30+ (face)", why: "Glow + no premature aging" },
  { item: "Lubricating eye drops", why: "Screen / AC dryness" },
  { item: "Antiperspirant + light cologne", why: "Smell good, not loud" },
  { item: "Clean towels + fresh tees", why: "Post-gym presence" },
  { item: "Nail clippers + brow trimmer", why: "Grooming" },
  { item: "Lip balm (plain)", why: "Dry lips ruin the look" },
  { item: "Sugar-free gum / mints", why: "Breath + Zyn replacement habit" },
  { item: "Refillable water bottle (1L+)", why: "3–4 L fluids" },
];

export type RitualReminder = {
  id: string;
  hour: number;
  minute: number;
  title: string;
  body: string;
};

/** Phone pop-up schedule when rituals reminders are enabled. */
export const RITUAL_REMINDERS: RitualReminder[] = [
  {
    id: "r_am",
    hour: 7,
    minute: 15,
    title: "Morning rituals",
    body: "Push-ups · brush + tongue scrape · face + SPF · zero Zyns. Start clean.",
  },
  {
    id: "r_mid",
    hour: 13,
    minute: 0,
    title: "Midday reset",
    body: "Posture · breath check · water · no Zyns. You should smell fresh.",
  },
  {
    id: "r_post",
    hour: 18,
    minute: 30,
    title: "Post-train glow",
    body: "Shower · fresh clothes · deodorant · light cologne. Look put-together.",
  },
  {
    id: "r_pm",
    hour: 21,
    minute: 30,
    title: "Night rituals",
    body: "Floss · brush · face cleanse · evening push-ups · sleep window. Still zero Zyns.",
  },
];

export function ritualsByCategory(category: RitualCategory): RitualItem[] {
  return RITUAL_PLAYBOOK.filter((r) => r.category === category);
}

export function dailyRitualProgress(done: Record<string, boolean>): {
  done: number;
  total: number;
  pct: number;
} {
  const total = DAILY_RITUALS.length;
  const n = DAILY_RITUALS.filter((r) => done[r.id]).length;
  return { done: n, total, pct: total ? Math.round((n / total) * 100) : 0 };
}
