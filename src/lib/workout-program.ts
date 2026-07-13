/** Official weekly program — Push → Pull → Legs (Rodrigues preference).
 * Push: chest, shoulders, triceps
 * Pull: back, biceps, forearms, core
 * Legs: all lower + core
 * Synced via scripts/sync-workout-program.mjs
 */

export type ProgramExercise = {
  name: string;
  sets: string;
  reps: string;
  notes?: string;
};

export type ProgramDay = {
  weekDay: number;
  dayName: string;
  label: string;
  muscleGroups: string;
  goal: string;
  cardio: string;
  exercises: ProgramExercise[];
};

/** Monday — Push A */
export const PUSH_A: ProgramExercise[] = [
  { name: "Incline Smith or DB press", sets: "4", reps: "6–10", notes: "Chest lead" },
  { name: "Flat machine chest press", sets: "3", reps: "8–12" },
  { name: "Cable fly (low-to-high)", sets: "3", reps: "12–15", notes: "Upper-chest bias" },
  { name: "Pec deck or machine fly", sets: "3", reps: "12–15" },
  { name: "Seated shoulder press", sets: "3", reps: "6–10" },
  { name: "Cable lateral raise", sets: "4", reps: "12–20" },
  { name: "Rope triceps pushdown", sets: "3", reps: "10–15" },
  { name: "Overhead cable triceps ext.", sets: "2", reps: "10–15" },
  { name: "Ab wheel", sets: "3", reps: "8–12" },
];

/** Tuesday — Pull A */
export const PULL_A: ProgramExercise[] = [
  { name: "Pull-ups or assisted pull-ups", sets: "4", reps: "6–10" },
  { name: "Diverging lat pulldown", sets: "4", reps: "8–12", notes: "Primary width" },
  { name: "Lat pulldown (standard / wide)", sets: "3", reps: "8–12" },
  { name: "Chest-supported row", sets: "3", reps: "8–12" },
  { name: "Rear delt machine", sets: "4", reps: "15–20" },
  { name: "Incline dumbbell curl", sets: "3", reps: "8–12" },
  { name: "Hammer curl", sets: "2", reps: "10–15" },
  { name: "Reverse curl / wrist curl", sets: "2", reps: "12–15", notes: "Forearms" },
  { name: "Cable crunch", sets: "3", reps: "12–15" },
];

/** Wednesday — Legs A */
export const LOWER_A: ProgramExercise[] = [
  { name: "Pogo jumps", sets: "2", reps: "20", notes: "Optional / fresh only" },
  { name: "Accelerations", sets: "6", reps: "8–10 sec", notes: "90–150 s rest — quality" },
  { name: "Back squat", sets: "4", reps: "5–8", notes: "Priority compound" },
  { name: "Walking lunges", sets: "4", reps: "12–16 steps each" },
  { name: "Romanian deadlift", sets: "3", reps: "6–10" },
  { name: "Bulgarian split squat", sets: "3", reps: "8–12 each" },
  { name: "Leg curl", sets: "3", reps: "10–15" },
  { name: "Standing calf raise", sets: "4", reps: "10–15" },
  { name: "Cable crunch", sets: "3", reps: "12–15" },
];

/** Thursday — Push B */
export const PUSH_B: ProgramExercise[] = [
  { name: "Flat bench press", sets: "3", reps: "5–8" },
  { name: "Incline machine press", sets: "3", reps: "8–12" },
  { name: "Cable fly / pec deck fly", sets: "3", reps: "12–15" },
  { name: "Cable machine chest press", sets: "2", reps: "10–15" },
  { name: "Machine shoulder press", sets: "2", reps: "8–12" },
  { name: "DB or machine lateral raise", sets: "4", reps: "15–25" },
  { name: "Rear delt machine", sets: "3", reps: "15–20" },
  { name: "Triceps pushdown", sets: "3", reps: "10–15" },
  { name: "Overhead triceps ext.", sets: "2", reps: "12–15" },
  { name: "Hanging leg raise", sets: "3", reps: "10–15" },
];

/** Friday — Pull B */
export const PULL_B: ProgramExercise[] = [
  { name: "T-bar or supported machine row", sets: "4", reps: "6–10" },
  { name: "Diverging lat pulldown", sets: "3", reps: "8–12" },
  { name: "Seated cable row", sets: "3", reps: "10–12" },
  { name: "Straight-arm pulldown", sets: "2", reps: "12–15" },
  { name: "Face pull / rear delt", sets: "3", reps: "15–20" },
  { name: "Preacher curl", sets: "3", reps: "8–12" },
  { name: "Hammer / reverse curl", sets: "2", reps: "12–15", notes: "Forearms + biceps" },
  { name: "Farmer carry or wrist work", sets: "2", reps: "30–40 sec" },
  { name: "Stomach vacuum", sets: "4", reps: "20–30 sec" },
];

/** Saturday — Legs B */
export const LOWER_B: ProgramExercise[] = [
  { name: "Box jumps", sets: "3", reps: "3", notes: "Optional" },
  { name: "5-10-5 shuttle", sets: "4", reps: "full recovery" },
  { name: "Trap-bar deadlift", sets: "3", reps: "4–6" },
  { name: "Front squat or hack squat", sets: "3", reps: "6–10" },
  { name: "Walking lunges", sets: "4", reps: "12–16 steps each" },
  { name: "Hip thrust", sets: "3", reps: "8–12" },
  { name: "Hamstring curl", sets: "3", reps: "10–15" },
  { name: "Seated calf raise", sets: "3", reps: "12–20" },
  { name: "Pallof press", sets: "3", reps: "10–15 each" },
];

export const REST_DAY: ProgramExercise[] = [
  { name: "Zone 2 walk / bike", sets: "1", reps: "50–70 min" },
  { name: "Hip flexor stretch", sets: "2", reps: "45 sec each" },
  { name: "Hamstring stretch", sets: "2", reps: "45 sec each" },
  { name: "Dead bug", sets: "3", reps: "8 each" },
  { name: "Front plank", sets: "3", reps: "30–45 sec" },
];

export const OFFICIAL_WORKOUT_PROGRAM: ProgramDay[] = [
  {
    weekDay: 0,
    dayName: "Rest",
    label: "Sunday — Cardio / Recovery",
    muscleGroups: "Mobility, Steps, Core",
    goal: "Recover. 12–15k steps. Optional sauna.",
    cardio: "50–70 min Zone 2 · 12,000–15,000 steps",
    exercises: REST_DAY,
  },
  {
    weekDay: 1,
    dayName: "Push A",
    label: "Monday — Push (chest, shoulders, triceps)",
    muscleGroups: "Chest, Shoulders, Triceps, Core",
    goal: "Chest first, then shoulders, finish triceps + core.",
    cardio: "20–25 min Zone 2",
    exercises: PUSH_A,
  },
  {
    weekDay: 2,
    dayName: "Pull A",
    label: "Tuesday — Pull (back, biceps, forearms, core)",
    muscleGroups: "Back, Rear Delts, Biceps, Forearms, Core",
    goal: "Width + arms. Forearms after curls.",
    cardio: "25–30 min incline walk / Zone 2",
    exercises: PULL_A,
  },
  {
    weekDay: 3,
    dayName: "Legs A",
    label: "Wednesday — Legs (all lower + core)",
    muscleGroups: "Quads, Hamstrings, Glutes, Calves, Core",
    goal: "Squat + lunges priority. Optional speed work.",
    cardio: "Easy walking only — hit steps",
    exercises: LOWER_A,
  },
  {
    weekDay: 4,
    dayName: "Push B",
    label: "Thursday — Push (chest, shoulders, triceps)",
    muscleGroups: "Chest, Shoulders, Triceps, Core",
    goal: "Second push — fly/cable chest, laterals, tris.",
    cardio: "25–30 min Zone 2",
    exercises: PUSH_B,
  },
  {
    weekDay: 5,
    dayName: "Pull B",
    label: "Friday — Pull (back, biceps, forearms, core)",
    muscleGroups: "Back, Biceps, Forearms, Core",
    goal: "Thickness day + forearm finishers.",
    cardio: "30–35 min Zone 2",
    exercises: PULL_B,
  },
  {
    weekDay: 6,
    dayName: "Legs B",
    label: "Saturday — Legs (all lower + core)",
    muscleGroups: "Quads, Hamstrings, Glutes, Calves, Core",
    goal: "Athletic lower + high lunge volume + core.",
    cardio: "Optional 10 min easy cooldown",
    exercises: LOWER_B,
  },
];
