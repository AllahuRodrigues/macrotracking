/**
 * Evidence-based 21-day maximum-definition plan.
 * Pure data + light helpers, safe to import from both web and Expo mobile.
 */

export const PLAN_TITLE = "21-Day Maximum-Definition Plan";
export const PLAN_SUBTITLE =
  "Preserve muscle, tighten calories, kill bloat swings, reveal the frame you already have.";
export const PLAN_START_ISO = "2026-07-13";
export const PLAN_DAYS = 21;

export const PLAN_BOTTOM_LINE =
  "Keep calories controlled, protein high but not absurd, carbs strategic around training, steps very high, lifting hard, sprints as seasoning not the main meal, creatine and maybe caffeine, citrulline optional — and remove every binge food and alcohol day until the block is over.";

/** Hard rules that apply every single day of the block. */
export const PLAN_RULES: string[] = [
  "12,000–15,000 steps daily, including Sunday.",
  "7.5–9 hours of sleep, consistent bedtime.",
  "No alcohol, soda, pastries, fried-food blowouts, or cheat days.",
  "3–4 L of fluids daily, more when sweating heavily.",
  "Keep salt and water consistent — don't manipulate them for the mirror.",
  "Compounds finish ~1–2 reps in reserve; last isolation set may hit 0–1 RIR.",
  "Rest 2–3 min on compounds, 60–90 s on isolation.",
  "Keep lifting under ~90 min before cardio.",
  "You can't spot-reduce face, belly, or chest fat — the deficit does that.",
];

/** Extra protocols the user runs on top of the plan. */
export const PLAN_EXTRAS = {
  trainingHoursPerDay: "3–4 h training/day (lift + cardio + steps)",
  sauna: "2 × 30 min sauna per week (recovery, not fat loss)",
  asthmaNote:
    "Asthma: 10–12 min progressive warm-up before sprints/cardio. Only do high-intensity work when controlled; use your prescribed inhaler. Stop on unusual wheeze, chest tightness, or dizziness.",
};

export type PlanExercise = { name: string; scheme: string; note?: string };
export type PlanDay = {
  weekDay: number; // 0 = Sunday … 6 = Saturday
  title: string;
  focus: string;
  warmup?: string;
  blocks: { heading?: string; exercises: PlanExercise[] }[];
  cardio?: string;
  coachNote?: string;
};

export const PLAN_WEEK: PlanDay[] = [
  {
    weekDay: 1,
    title: "Monday — Back width, rear delts, biceps",
    focus: "Lats, rear delts, biceps, core",
    warmup: "7–10 min: shoulder circles, band pull-aparts, 2 ramp-up sets",
    blocks: [
      {
        exercises: [
          { name: "Pull-ups or assisted pull-ups", scheme: "4 × 6–10" },
          { name: "Chest-supported row", scheme: "3 × 8–12" },
          { name: "Neutral-grip lat pulldown", scheme: "3 × 8–12" },
          { name: "Single-arm cable lat row", scheme: "2 × 10–15 each" },
          { name: "Reverse pec deck", scheme: "3 × 15–20" },
          { name: "Incline dumbbell curl", scheme: "3 × 8–12" },
          { name: "Hammer curl", scheme: "2 × 10–15" },
          { name: "Cable crunch", scheme: "3 × 12–15" },
        ],
      },
    ],
    cardio: "25–30 min incline walk / Zone 2 cycling",
    coachNote:
      "Lats + upper back shrink the waist visually faster than chasing chest volume.",
  },
  {
    weekDay: 2,
    title: "Tuesday — Upper chest, shoulders, triceps",
    focus: "Upper chest, delts, triceps, core",
    blocks: [
      {
        exercises: [
          { name: "Incline Smith / DB press", scheme: "4 × 6–10" },
          { name: "Flat machine chest press", scheme: "3 × 8–12" },
          { name: "Seated shoulder press", scheme: "3 × 6–10" },
          { name: "Low-to-high cable fly", scheme: "2 × 12–15" },
          { name: "Cable lateral raise", scheme: "4 × 12–20" },
          { name: "Rope triceps pushdown", scheme: "3 × 10–15" },
          { name: "Overhead cable triceps ext.", scheme: "2 × 10–15" },
          { name: "Ab wheel", scheme: "3 × 8–12" },
        ],
      },
    ],
    cardio: "20–25 min Zone 2",
    coachNote:
      "Most important aesthetic day for chest shape + shoulder-to-waist ratio. Don't pile on 5 extra chest moves.",
  },
  {
    weekDay: 3,
    title: "Wednesday — Lower strength + acceleration",
    focus: "Quads, hams, glutes, calves, speed",
    warmup: "Progressive 10–12 min (asthma-safe) before speed work",
    blocks: [
      {
        heading: "Athletic prep (fresh, before lifting)",
        exercises: [
          { name: "Pogo jumps", scheme: "2 × 20" },
          { name: "A-skips", scheme: "2 × 20 m" },
          { name: "Broad jumps", scheme: "3 × 3" },
          { name: "Accelerations", scheme: "6 × 8–10 s", note: "90–150 s full recovery — fast & clean, not conditioning" },
        ],
      },
      {
        heading: "Strength",
        exercises: [
          { name: "Back squat", scheme: "4 × 5–8" },
          { name: "Romanian deadlift", scheme: "3 × 6–10" },
          { name: "Leg press", scheme: "3 × 10–15" },
          { name: "Seated / lying leg curl", scheme: "3 × 10–15" },
          { name: "Bulgarian split squat", scheme: "2 × 8–12 each" },
          { name: "Standing calf raise", scheme: "4 × 10–15" },
          { name: "Tibialis raise", scheme: "2 × 15–25" },
        ],
      },
    ],
    cardio: "No hard cardio — hit daily steps with easy walking",
  },
  {
    weekDay: 4,
    title: "Thursday — Back thickness, traps, forearms",
    focus: "Back thickness, traps, forearms, posture",
    blocks: [
      {
        exercises: [
          { name: "T-bar / supported machine row", scheme: "4 × 6–10" },
          { name: "Close neutral-grip pulldown", scheme: "3 × 8–12" },
          { name: "Seated cable row", scheme: "3 × 10–12" },
          { name: "Machine pullover / straight-arm pulldown", scheme: "2 × 12–15" },
          { name: "Face pull / cable Y-raise", scheme: "3 × 15–20" },
          { name: "DB / machine shrug", scheme: "3 × 10–15" },
          { name: "Preacher curl", scheme: "3 × 8–12" },
          { name: "Reverse curl", scheme: "2 × 12–15" },
          { name: "Stomach vacuum", scheme: "4 × 20–30 s" },
        ],
      },
    ],
    cardio: "30–35 min Zone 2",
  },
  {
    weekDay: 5,
    title: "Friday — Chest, delts, triceps, abs",
    focus: "Chest, delts, triceps, abs",
    blocks: [
      {
        exercises: [
          { name: "Flat bench press", scheme: "3 × 5–8" },
          { name: "Incline machine press", scheme: "3 × 8–12" },
          { name: "Cable fly / pec deck", scheme: "2 × 12–15" },
          { name: "Machine shoulder press", scheme: "2 × 8–12" },
          { name: "DB / machine lateral raise", scheme: "4 × 15–25" },
          { name: "Rear-delt fly", scheme: "2 × 15–20" },
          { name: "Triceps pushdown", scheme: "3 × 10–15" },
          { name: "Overhead triceps ext.", scheme: "2 × 12–15" },
          { name: "Hanging leg raise", scheme: "3 × 10–15" },
        ],
      },
    ],
    cardio: "25–30 min Zone 2",
    coachNote: "Lateral raises controlled, lead with elbows — no heavy swinging.",
  },
  {
    weekDay: 6,
    title: "Saturday — Athletic lower + agility",
    focus: "Power, agility, conditioning",
    blocks: [
      {
        heading: "Plyo & agility (quality, not exhaustion)",
        exercises: [
          { name: "Box jumps", scheme: "3 × 3" },
          { name: "Lateral bounds", scheme: "3 × 4 each" },
          { name: "5-10-5 shuttle", scheme: "4 reps, full recovery" },
          { name: "L-drill / 3-cone", scheme: "3 reps, full recovery" },
        ],
      },
      {
        heading: "Strength",
        exercises: [
          { name: "Trap-bar deadlift", scheme: "3 × 4–6" },
          { name: "Front / hack squat", scheme: "3 × 6–10" },
          { name: "Hip thrust", scheme: "3 × 8–12" },
          { name: "Leg extension", scheme: "2 × 12–15" },
          { name: "Hamstring curl", scheme: "3 × 10–15" },
          { name: "Walking lunge", scheme: "2 × 12 steps each" },
          { name: "Seated calf raise", scheme: "3 × 12–20" },
          { name: "Pallof press", scheme: "3 × 10–15 each" },
        ],
      },
    ],
    cardio: "Optional 10 min easy cooldown",
  },
  {
    weekDay: 0,
    title: "Sunday — Cardio, recovery, mobility",
    focus: "Recover — still counts as training",
    blocks: [
      {
        exercises: [
          { name: "Zone 2 walk / bike / elliptical", scheme: "50–70 min" },
          { name: "Hip-flexor stretch", scheme: "2 × 45 s each" },
          { name: "Hamstring stretch", scheme: "2 × 45 s each" },
          { name: "Calf stretch", scheme: "2 × 45 s each" },
          { name: "Thoracic rotations", scheme: "2 × 10 each" },
          { name: "Dead bug", scheme: "3 × 8 each" },
          { name: "Front plank", scheme: "3 × 30–45 s" },
        ],
      },
    ],
    coachNote: "Sauna fits here or after Thursday — 2 × 30 min/week for recovery.",
  },
];

export const PLAN_PROGRESSION = [
  {
    week: "Week 1 — Establish",
    points: [
      "Conservative weights, ~2 reps in reserve on almost every set.",
      "Record every working weight and rep.",
      "No added exercises, drop sets, or training through joint pain.",
    ],
  },
  {
    week: "Week 2 — Overload",
    points: [
      "Per exercise: add 1 rep/set OR +2.5–5% load after topping the rep range.",
      "Add 5 min to Mon/Thu/Fri cardio (cap 35–40 min after lifting).",
      "Only the final isolation set may reach technical failure.",
    ],
  },
  {
    week: "Week 3 — Peak & reveal",
    points: [
      "Mon–Wed: maintain Week 2 performance.",
      "Thu–Sat: drop one set per compound, keep the weight, stop 1–2 reps short.",
      "Saturday agility fast but only 3 shuttle reps.",
      "Sunday: 45–60 min easy Zone 2. Less fatigue = fuller, less inflamed look.",
    ],
  },
];

/** 140 g milk-and-powder shake protocol — 4 servings across the day. */
export const SHAKE_PROTOCOL = {
  title: "140 g protein shake protocol",
  perServing: "1 scoop whey + 200 mL ultra-filtered milk ≈ 35 g protein",
  daily: "4 servings ≈ 139–140 g protein · 4 scoops · 800 mL milk · ~896 kcal",
  timing: [
    "Breakfast",
    "Midday / 60–90 min pre-training",
    "Immediately post-training",
    "Evening",
  ],
  note: "Spread them out — 4 feedings ~3 h apart beat 2 big boluses for MPS. Use lactose-free / lower-fat milk if bloated.",
};

export type MealTemplate = {
  slot: string;
  items: string[];
};

export const TRAINING_DAY_TEMPLATE = {
  target: "2,100–2,200 kcal · 185–200 g protein · 50–60 g fat · rest carbs",
  meals: [
    { slot: "Breakfast", items: ["Shake 1", "3 whole eggs + 2 whites", "2 slices whole-grain bread", "Fruit or veg"] },
    { slot: "Midday", items: ["Shake 2", "1 Oikos protein yogurt"] },
    { slot: "Pre-workout", items: ["2–4 dates (4 on Wed/Sat, 2 on upper days)", "Tea or coffee", "Water"] },
    { slot: "Post-workout", items: ["Shake 3", "1 banana on lower days", "~300 g potato or 1–1.5 cups rice", "≥2 cups veg", "1 tsp olive oil / measured sauce"] },
    { slot: "Evening", items: ["Shake 4", "Berries / fruit if calories allow"] },
  ] as MealTemplate[],
};

export const REST_DAY_TEMPLATE = {
  target: "1,900–2,000 kcal — carbs pulled down",
  meals: [
    { slot: "Keep", items: ["All 4 shakes", "Eggs + yogurt"] },
    { slot: "Reduce carbs", items: ["2 dates instead of 4", "2 bread slices total", "~200–250 g potato or smaller rice", "Keep veg + fruit"] },
  ] as MealTemplate[],
};

export const SUPPLEMENT_GUIDANCE = [
  { name: "Creatine monohydrate", verdict: "keep", detail: "5 g daily. Strong evidence. You do not need 10 g." },
  { name: "Caffeine", verdict: "optional", detail: "100–200 mg 30–60 min pre-select-sessions. Not within ~8 h of bed." },
  { name: "L-Citrulline", verdict: "optional", detail: "Your 6 g is fine but evidence is limited/conflicting. Not fat loss." },
  { name: "Vitamin D3 5,000 IU", verdict: "review", detail: "Above the 4,000 IU adult upper limit unless medically directed." },
  { name: "Zinc 50 mg", verdict: "review", detail: "≥50 mg for weeks can impair copper absorption (UL 40 mg/day)." },
  { name: "Fat burners / stim stacks", verdict: "avoid", detail: "Not worth the sleep/heart-rate/recovery cost." },
] as const;

export const APPEARANCE_RULES = [
  "Weigh in every morning after the bathroom; judge the 7-day average, not one day.",
  "Waist measurement + identical front/side photos every 7 days.",
  "No restaurant blowouts, alcohol, or high-sodium binges for the full block.",
  "Keep carbs around workouts, not zero — zero carbs looks flat, not sharp.",
  "No laxatives, diuretics, dehydration, sweat suits, or marathon sauna for 'fat loss.'",
  "Realistic 21-day win: smaller waist, leaner face, better chest/shoulder look, preserved strength — not 14 lb of pure fat.",
];

export function planDayFor(weekDay: number): PlanDay {
  return PLAN_WEEK.find((d) => d.weekDay === weekDay) ?? PLAN_WEEK[0];
}

/** Which plan week (1–3) a given date falls in, or 0 if outside the block. */
export function planWeekNumber(fromISO: string): number {
  const start = new Date(PLAN_START_ISO + "T00:00:00");
  const now = new Date(fromISO + "T00:00:00");
  const diffDays = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  if (diffDays < 0 || diffDays >= PLAN_DAYS) return 0;
  return Math.floor(diffDays / 7) + 1;
}
