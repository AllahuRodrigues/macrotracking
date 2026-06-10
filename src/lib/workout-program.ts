/** Official weekly program — synced to Supabase via scripts/sync-workout-program.mjs */

export type ProgramExercise = {
  name: string;
  sets: string;
  reps: string;
  notes?: string;
};

export type ProgramDay = {
  weekDay: number; // 0=Sun … 6=Sat
  dayName: string;
  label: string;
  muscleGroups: string;
  goal: string;
  cardio: string;
  exercises: ProgramExercise[];
};

export const CHEST_TRICEPS: ProgramExercise[] = [
  { name: "Chest flys", sets: "3", reps: "12–15" },
  { name: "Cable machine chest variations", sets: "3", reps: "10–15" },
  { name: "Tricep pushdown", sets: "4", reps: "10–15" },
  { name: "Torso rotations", sets: "3", reps: "12–15 each side", notes: "Core / obliques" },
  { name: "Bench press", sets: "4", reps: "6–10" },
  { name: "Incline machine chest press", sets: "3", reps: "8–12" },
  { name: "Forearm curls", sets: "3", reps: "12–15" },
  { name: "Overhead tricep extension", sets: "3", reps: "10–15" },
];

export const PULL_SHOULDERS_ARMS: ProgramExercise[] = [
  { name: "Diverging lat pull down", sets: "4", reps: "8–12" },
  { name: "Rear delt fly", sets: "4", reps: "12–20" },
  { name: "Deadlift", sets: "3", reps: "5–8" },
  { name: "Shoulder press", sets: "4", reps: "6–10" },
  { name: "Lateral raises", sets: "4", reps: "12–20" },
  { name: "Bicep curls", sets: "3", reps: "8–12" },
  { name: "Preacher curl", sets: "3", reps: "10–12" },
  { name: "Hammer curl", sets: "3", reps: "10–15" },
  { name: "Shoulder machine press", sets: "3", reps: "8–12" },
  { name: "Torso rotations", sets: "3", reps: "12–15 each side" },
  { name: "Farmers carry", sets: "3", reps: "40–60 sec", notes: "Heavy dumbbells or kettlebells" },
];

export const LEGS: ProgramExercise[] = [
  { name: "Walking lunges", sets: "3", reps: "12 steps each leg" },
  { name: "Leg curls", sets: "3", reps: "10–15" },
  { name: "Hamstring curls", sets: "3", reps: "10–15" },
  { name: "Calf raises", sets: "4", reps: "12–20" },
  { name: "Hip thrust", sets: "4", reps: "8–12" },
  { name: "Closing hip / open hip", sets: "2", reps: "10–12 each", notes: "Hip mobility — band or bodyweight" },
  { name: "Squats", sets: "4", reps: "6–10" },
  { name: "Wrist curl", sets: "3", reps: "12–15" },
  { name: "Torso rotations", sets: "3", reps: "12–15 each side" },
  { name: "Leg raises", sets: "3", reps: "10–15" },
];

export const REST_DAY: ProgramExercise[] = [
  { name: "Hip flexor stretch", sets: "3", reps: "60 sec each side" },
  { name: "Hamstring stretch", sets: "3", reps: "60 sec each side" },
  { name: "Light walk", sets: "1", reps: "8,000–12,000 steps" },
];

export const OFFICIAL_WORKOUT_PROGRAM: ProgramDay[] = [
  {
    weekDay: 0,
    dayName: "Rest",
    label: "Sunday — Rest / Active Recovery",
    muscleGroups: "Mobility, Steps",
    goal: "Recover. Light steps and stretching only.",
    cardio: "8,000–12,000 steps walking",
    exercises: REST_DAY,
  },
  {
    weekDay: 1,
    dayName: "Chest + Triceps",
    label: "Monday — Chest + Triceps",
    muscleGroups: "Chest, Triceps, Forearms, Core",
    goal: "Chest volume, triceps, and core rotation work.",
    cardio: "50 min walk on active days (~200 kcal burn)",
    exercises: CHEST_TRICEPS,
  },
  {
    weekDay: 2,
    dayName: "Pull",
    label: "Tuesday — Pull + Shoulders + Arms",
    muscleGroups: "Back, Rear Delts, Shoulders, Biceps, Core",
    goal: "Lats, deadlift strength, shoulders, and arm hypertrophy.",
    cardio: "50 min walk optional after lifting",
    exercises: PULL_SHOULDERS_ARMS,
  },
  {
    weekDay: 3,
    dayName: "Legs",
    label: "Wednesday — Legs",
    muscleGroups: "Quads, Hamstrings, Glutes, Calves, Core",
    goal: "Leg strength and glute focus. Hip mobility between compounds.",
    cardio: "10–15 min easy walk — legs day",
    exercises: LEGS,
  },
  {
    weekDay: 4,
    dayName: "Pull",
    label: "Thursday — Pull + Shoulders + Arms",
    muscleGroups: "Back, Rear Delts, Shoulders, Biceps, Core",
    goal: "Same as Tuesday — back width, shoulders, arms.",
    cardio: "50 min walk optional after lifting",
    exercises: PULL_SHOULDERS_ARMS,
  },
  {
    weekDay: 5,
    dayName: "Chest + Triceps",
    label: "Friday — Chest + Triceps",
    muscleGroups: "Chest, Triceps, Forearms, Core",
    goal: "Repeat Monday chest + triceps session.",
    cardio: "50 min walk on active days (~200 kcal burn)",
    exercises: CHEST_TRICEPS,
  },
  {
    weekDay: 6,
    dayName: "Legs",
    label: "Saturday — Legs",
    muscleGroups: "Quads, Hamstrings, Glutes, Calves, Core",
    goal: "Repeat Wednesday leg session.",
    cardio: "10–15 min easy walk or conditioning",
    exercises: LEGS,
  },
];
