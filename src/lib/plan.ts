/**
 * Definition cut plan — two blocks with a short reset.
 * Block 1: Jul 13–31 · Reset: Aug 1–2 · Block 2: Aug 3–14
 * Split: Push (chest / shoulders / tris) → Pull (back / bis / forearms / core) → Legs (+ core)
 */

export const PLAN_TITLE = "Definition Block — Jul 13 → Aug 14";
export const PLAN_SUBTITLE =
  "Push · Pull · Legs. Preserve 86.9 lb muscle, drop trunk fat, land ~174 lb @ 14–16% BF.";

export const PLAN_START_ISO = "2026-07-13";
export const PLAN_END_ISO = "2026-08-14";
export const PLAN_GOAL_WEIGHT_LBS = 174;
export const PLAN_GOAL_BF = "14–16%";

export type PlanPhase = {
  id: string;
  label: string;
  start: string;
  end: string;
  rest?: boolean;
};

/** Active cut windows + 2-day reset between blocks. */
export const PLAN_PHASES: PlanPhase[] = [
  { id: "block1", label: "Block 1", start: "2026-07-13", end: "2026-07-31" },
  { id: "reset", label: "Reset", start: "2026-08-01", end: "2026-08-02", rest: true },
  { id: "block2", label: "Block 2", start: "2026-08-03", end: "2026-08-14" },
];

/** Calendar days from first start through final end (inclusive of reset). */
export const PLAN_CALENDAR_DAYS = 33; // Jul 13 → Aug 14

function isoToDate(iso: string): Date {
  return new Date(iso + "T00:00:00");
}

function daysBetween(a: string, b: string): number {
  return Math.floor((isoToDate(b).getTime() - isoToDate(a).getTime()) / 86_400_000);
}

export function planPhaseFor(iso: string): PlanPhase | null {
  for (const p of PLAN_PHASES) {
    if (iso >= p.start && iso <= p.end) return p;
  }
  return null;
}

/** Day index within an active block (1-based), or 0 if outside / on reset. */
export function planDayNumber(iso: string): number {
  const phase = planPhaseFor(iso);
  if (!phase || phase.rest) return 0;
  return daysBetween(phase.start, iso) + 1;
}

/** Total active training days across both blocks up to `iso` (includes today if in block). */
export function planActiveDayCount(iso: string): number {
  let count = 0;
  for (const p of PLAN_PHASES) {
    if (p.rest) continue;
    if (iso < p.start) break;
    const end = iso < p.end ? iso : p.end;
    count += daysBetween(p.start, end) + 1;
  }
  return count;
}

export const PLAN_ACTIVE_DAYS_TOTAL = PLAN_PHASES.filter((p) => !p.rest).reduce(
  (n, p) => n + daysBetween(p.start, p.end) + 1,
  0
);

/** @deprecated use PLAN_ACTIVE_DAYS_TOTAL — kept for older imports */
export const PLAN_DAYS = PLAN_ACTIVE_DAYS_TOTAL;

export const PLAN_BOTTOM_LINE =
  "Push chest/shoulders/tris, Pull back/bis/forearms/core, Legs all lower + core. High protein, steps 12–15k, sleep 7.5–9h — no cheat days until Aug 14.";

/** Hard rules that apply every single day of the block. */
export const PLAN_RULES: string[] = [
  "12,000–15,000 steps daily, including Sunday.",
  "7.5–9 hours of sleep, consistent bedtime.",
  "No alcohol, soda, pastries, fried-food blowouts, or cheat days.",
  "No Zyns / nicotine — gums, vessels, sleep, and the cut all win when you quit.",
  "3–4 L of fluids daily, more when sweating heavily.",
  "Keep salt and water consistent — don't manipulate them for the mirror.",
  "Compounds finish ~1–2 reps in reserve; last isolation set may hit 0–1 RIR.",
  "Rest 2–3 min on compounds, 60–90 s on isolation.",
  "Keep lifting under ~90 min before cardio.",
  "Daily rituals: push-ups, face/SPF, floss, smell clean — see Rituals tab.",
  "You can't spot-reduce face, belly, or chest fat — the deficit does that.",
];

/** Extra protocols the user runs on top of the plan. */
export const PLAN_EXTRAS = {
  trainingHoursPerDay: "3–4 h training/day (lift + cardio + steps)",
  sauna: "2 × 30 min sauna per week (Wed & Sun preferred)",
  split: "Push (chest · shoulders · triceps) → Pull (back · biceps · forearms · core) → Legs (quads · hams · glutes · calves · core)",
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

/** Classic PPL — Push starts the week (user preference). */
export const PLAN_WEEK: PlanDay[] = [
  {
    weekDay: 1,
    title: "Monday — Push A (chest, shoulders, triceps)",
    focus: "Chest · shoulders · triceps · light core",
    warmup: "7–10 min: arm circles, band pull-aparts, 2 ramp-up sets",
    blocks: [
      {
        heading: "Chest",
        exercises: [
          { name: "Incline Smith / DB press", scheme: "4 × 6–10" },
          { name: "Flat machine chest press", scheme: "3 × 8–12" },
          { name: "Cable fly (low-to-high)", scheme: "3 × 12–15" },
          { name: "Pec deck / machine fly", scheme: "3 × 12–15" },
        ],
      },
      {
        heading: "Shoulders",
        exercises: [
          { name: "Seated shoulder press", scheme: "3 × 6–10" },
          { name: "Cable lateral raise", scheme: "4 × 12–20" },
        ],
      },
      {
        heading: "Triceps",
        exercises: [
          { name: "Rope triceps pushdown", scheme: "3 × 10–15" },
          { name: "Overhead cable triceps ext.", scheme: "2 × 10–15" },
        ],
      },
      {
        heading: "Core",
        exercises: [{ name: "Ab wheel", scheme: "3 × 8–12" }],
      },
    ],
    cardio: "20–25 min Zone 2",
    coachNote: "Chest → shoulders → tris. Don't skip laterals — shoulder width sells the cut.",
  },
  {
    weekDay: 2,
    title: "Tuesday — Pull A (back, biceps, forearms, core)",
    focus: "Lats · upper back · rear delts · biceps · forearms · core",
    warmup: "7–10 min: shoulder circles, band pull-aparts, 2 ramp-up sets",
    blocks: [
      {
        heading: "Back",
        exercises: [
          { name: "Pull-ups or assisted pull-ups", scheme: "4 × 6–10" },
          { name: "Diverging lat pulldown", scheme: "4 × 8–12" },
          { name: "Lat pulldown (standard / wide)", scheme: "3 × 8–12" },
          { name: "Chest-supported row", scheme: "3 × 8–12" },
          { name: "Rear delt machine", scheme: "4 × 15–20" },
        ],
      },
      {
        heading: "Biceps & forearms",
        exercises: [
          { name: "Incline dumbbell curl", scheme: "3 × 8–12" },
          { name: "Hammer curl", scheme: "2 × 10–15" },
          { name: "Reverse curl / wrist curl", scheme: "2 × 12–15" },
        ],
      },
      {
        heading: "Core",
        exercises: [{ name: "Cable crunch", scheme: "3 × 12–15" }],
      },
    ],
    cardio: "25–30 min incline walk / Zone 2",
    coachNote: "Back width + thick arms. Forearms last — grip still fresh for rows.",
  },
  {
    weekDay: 3,
    title: "Wednesday — Legs A (all legs + core)",
    focus: "Quads · hams · glutes · calves · core · optional speed",
    warmup: "Progressive 10–12 min (asthma-safe) before speed work",
    blocks: [
      {
        heading: "Athletic prep (optional if fresh)",
        exercises: [
          { name: "Pogo jumps", scheme: "2 × 20" },
          { name: "Accelerations", scheme: "6 × 8–10 s", note: "90–150 s recovery — quality only" },
        ],
      },
      {
        heading: "Legs",
        exercises: [
          { name: "Back squat", scheme: "4 × 5–8" },
          { name: "Walking lunges", scheme: "4 × 12–16 steps each" },
          { name: "Romanian deadlift", scheme: "3 × 6–10" },
          { name: "Bulgarian split squat", scheme: "3 × 8–12 each" },
          { name: "Leg curl", scheme: "3 × 10–15" },
          { name: "Standing calf raise", scheme: "4 × 10–15" },
        ],
      },
      {
        heading: "Core",
        exercises: [{ name: "Cable crunch / hanging raise", scheme: "3 × 12–15" }],
      },
    ],
    cardio: "Easy walking only — hit steps",
    coachNote: "Squat + lunges are the money. Sauna OK tonight (1 of 2).",
  },
  {
    weekDay: 4,
    title: "Thursday — Push B (chest, shoulders, triceps)",
    focus: "Chest · shoulders · triceps · core",
    blocks: [
      {
        heading: "Chest",
        exercises: [
          { name: "Flat bench press", scheme: "3 × 5–8" },
          { name: "Incline machine press", scheme: "3 × 8–12" },
          { name: "Cable fly / pec deck", scheme: "3 × 12–15" },
          { name: "Cable chest press", scheme: "2 × 10–15" },
        ],
      },
      {
        heading: "Shoulders",
        exercises: [
          { name: "Machine shoulder press", scheme: "2 × 8–12" },
          { name: "DB / machine lateral raise", scheme: "4 × 15–25" },
          { name: "Rear delt machine", scheme: "3 × 15–20" },
        ],
      },
      {
        heading: "Triceps",
        exercises: [
          { name: "Triceps pushdown", scheme: "3 × 10–15" },
          { name: "Overhead triceps ext.", scheme: "2 × 12–15" },
        ],
      },
      {
        heading: "Core",
        exercises: [{ name: "Hanging leg raise", scheme: "3 × 10–15" }],
      },
    ],
    cardio: "25–30 min Zone 2",
  },
  {
    weekDay: 5,
    title: "Friday — Pull B (back, biceps, forearms, core)",
    focus: "Thickness · traps · biceps · forearms · core",
    blocks: [
      {
        heading: "Back",
        exercises: [
          { name: "T-bar / supported machine row", scheme: "4 × 6–10" },
          { name: "Diverging lat pulldown", scheme: "3 × 8–12" },
          { name: "Seated cable row", scheme: "3 × 10–12" },
          { name: "Straight-arm pulldown", scheme: "2 × 12–15" },
          { name: "Face pull / rear delt", scheme: "3 × 15–20" },
        ],
      },
      {
        heading: "Biceps & forearms",
        exercises: [
          { name: "Preacher curl", scheme: "3 × 8–12" },
          { name: "Hammer / reverse curl", scheme: "2 × 12–15" },
          { name: "Farmer carry or wrist work", scheme: "2 × 30–40 s" },
        ],
      },
      {
        heading: "Core",
        exercises: [{ name: "Stomach vacuum", scheme: "4 × 20–30 s" }],
      },
    ],
    cardio: "30–35 min Zone 2",
  },
  {
    weekDay: 6,
    title: "Saturday — Legs B (all legs + core)",
    focus: "Power · quads · hams · glutes · calves · core",
    blocks: [
      {
        heading: "Optional plyo",
        exercises: [
          { name: "Box jumps", scheme: "3 × 3" },
          { name: "5-10-5 shuttle", scheme: "4 reps, full recovery" },
        ],
      },
      {
        heading: "Legs",
        exercises: [
          { name: "Trap-bar deadlift", scheme: "3 × 4–6" },
          { name: "Front / hack squat", scheme: "3 × 6–10" },
          { name: "Walking lunges", scheme: "4 × 12–16 steps each" },
          { name: "Hip thrust", scheme: "3 × 8–12" },
          { name: "Hamstring curl", scheme: "3 × 10–15" },
          { name: "Seated calf raise", scheme: "3 × 12–20" },
        ],
      },
      {
        heading: "Core",
        exercises: [{ name: "Pallof press", scheme: "3 × 10–15 each" }],
      },
    ],
    cardio: "Optional 10 min easy cooldown",
  },
  {
    weekDay: 0,
    title: "Sunday — Cardio, recovery, mobility",
    focus: "Recover — still counts",
    blocks: [
      {
        exercises: [
          { name: "Zone 2 walk / bike / elliptical", scheme: "50–70 min" },
          { name: "Hip-flexor stretch", scheme: "2 × 45 s each" },
          { name: "Hamstring stretch", scheme: "2 × 45 s each" },
          { name: "Dead bug", scheme: "3 × 8 each" },
          { name: "Front plank", scheme: "3 × 30–45 s" },
        ],
      },
    ],
    coachNote: "Second sauna day if you missed Wed. 12–15k steps still.",
  },
];

export const PLAN_PROGRESSION = [
  {
    week: "Block 1 · Establish (Jul 13–19)",
    points: [
      "Conservative weights, ~2 RIR on almost every set.",
      "Log every working weight and rep.",
      "Lock Push → Pull → Legs order — no extra junk volume.",
    ],
  },
  {
    week: "Block 1 · Overload (Jul 20–31)",
    points: [
      "Per exercise: add 1 rep/set OR +2.5–5% load after topping the rep range.",
      "Add 5 min to cardio on Push/Pull days (cap ~35–40 min).",
      "Aug 1–2: reset — steps + Zone 2 only, sleep hard.",
    ],
  },
  {
    week: "Block 2 · Peak (Aug 3–14)",
    points: [
      "Hold performance; drop one set on compounds if recovery dips.",
      "Photos + waist every 7 days. Judge 7-day weight average.",
      "Finish Aug 14 leaner face/waist — not reckless under-eating.",
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
    { slot: "Pre-workout", items: ["2–4 dates (4 on leg days, 2 on Push/Pull)", "Tea or coffee", "Water"] },
    { slot: "Post-workout", items: ["Shake 3", "1 banana on leg days", "~300 g potato or 1–1.5 cups rice", "≥2 cups veg", "1 tsp olive oil / measured sauce"] },
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
  "No restaurant blowouts, alcohol, or high-sodium binges through Aug 14.",
  "Keep carbs around workouts, not zero — zero carbs looks flat, not sharp.",
  "No laxatives, diuretics, dehydration, sweat suits, or marathon sauna for 'fat loss.'",
  "Realistic win by Aug 14: smaller waist, leaner face, better chest/shoulder look, preserved strength.",
];

export function planDayFor(weekDay: number): PlanDay {
  return PLAN_WEEK.find((d) => d.weekDay === weekDay) ?? PLAN_WEEK[0];
}

/** Which progression week (1–3) a date falls in, or 0 if outside active blocks. */
export function planWeekNumber(fromISO: string): number {
  const phase = planPhaseFor(fromISO);
  if (!phase || phase.rest) return 0;
  if (phase.id === "block1") {
    const d = daysBetween(phase.start, fromISO);
    return d < 7 ? 1 : 2;
  }
  if (phase.id === "block2") return 3;
  return 0;
}
