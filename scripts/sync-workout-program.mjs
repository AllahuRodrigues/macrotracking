/**
 * Sync official workout program to Supabase (all 7 days)
 * Run: node scripts/sync-workout-program.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    const p = path.join(root, name);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i === -1) continue;
      const k = t.slice(0, i);
      const v = t.slice(i + 1).replace(/^"(.*)"$/, "$1");
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

loadEnv();

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  console.error("Missing Supabase keys in .env");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Keep in sync with src/lib/workout-program.ts
const PULL_A = [
  { name: "Pull-ups or assisted pull-ups", sets: "4", reps: "6–10" },
  { name: "Wide/neutral lat pulldown", sets: "4", reps: "8–12" },
  { name: "Chest-supported row", sets: "3", reps: "8–12" },
  { name: "Single-arm lat pulldown", sets: "3", reps: "10–15" },
  { name: "Straight-arm pulldown", sets: "3", reps: "12–15" },
  { name: "Rear delt fly", sets: "4", reps: "15–20" },
  { name: "Barbell or machine curl", sets: "3", reps: "8–12" },
  { name: "Hammer curl", sets: "3", reps: "10–15" },
  { name: "Stomach vacuums", sets: "3", reps: "20–30 sec" },
];

const PUSH_A = [
  { name: "Incline bench press or incline DB press", sets: "4", reps: "6–10" },
  { name: "Flat machine chest press", sets: "3", reps: "8–12" },
  { name: "Shoulder press", sets: "3", reps: "6–10" },
  { name: "Lateral raises", sets: "5", reps: "12–20" },
  { name: "Cable lateral raises", sets: "3", reps: "15–20" },
  { name: "Low-to-high cable fly", sets: "3", reps: "12–15" },
  { name: "Tricep pushdown", sets: "3", reps: "10–15" },
  { name: "Overhead tricep extension", sets: "3", reps: "10–15" },
  { name: "Hanging leg raises", sets: "3", reps: "10–15" },
];

const LOWER_A = [
  { name: "A-skips", sets: "2", reps: "20 m", notes: "Speed block — before lifting if possible" },
  { name: "High knees", sets: "2", reps: "20 m" },
  { name: "Sprints", sets: "6", reps: "15–20 sec", notes: "90–150 sec rest; bike sprints 8×10 sec if no track" },
  { name: "Back squat", sets: "4", reps: "5–8" },
  { name: "Romanian deadlift", sets: "3", reps: "6–10" },
  { name: "Leg press", sets: "3", reps: "10–15" },
  { name: "Leg curl", sets: "3", reps: "10–15" },
  { name: "Bulgarian split squat or walking lunges", sets: "3", reps: "10 each leg" },
  { name: "Standing calf raises", sets: "5", reps: "10–20" },
  { name: "Cable crunches", sets: "3", reps: "12–15" },
];

const PULL_B = [
  { name: "Barbell row or machine row", sets: "4", reps: "6–10" },
  { name: "Neutral-grip lat pulldown", sets: "4", reps: "8–12" },
  { name: "Seated cable row", sets: "3", reps: "10–12" },
  { name: "Machine pullover or straight-arm pulldown", sets: "3", reps: "12–15" },
  { name: "Rear delt fly / face pull", sets: "4", reps: "15–20" },
  { name: "Preacher curl", sets: "3", reps: "10–12" },
  { name: "Incline DB curl", sets: "3", reps: "10–15" },
  { name: "Farmer's carry", sets: "3", reps: "40–60 sec", notes: "Heavy dumbbells or kettlebells" },
  { name: "Stomach vacuums", sets: "3", reps: "20–30 sec" },
];

const PUSH_B = [
  { name: "Flat bench press", sets: "4", reps: "5–8" },
  { name: "Incline machine press", sets: "3", reps: "8–12" },
  { name: "Machine shoulder press", sets: "3", reps: "8–12" },
  { name: "Lateral raises", sets: "5", reps: "15–25" },
  { name: "Cable lateral raises", sets: "3", reps: "15–20" },
  { name: "Pec deck or cable fly", sets: "3", reps: "12–15" },
  { name: "Tricep pushdown", sets: "3", reps: "10–15" },
  { name: "Overhead tricep extension or skull crushers", sets: "3", reps: "10–15" },
  { name: "Hanging leg raise or ab wheel", sets: "3", reps: "10–15" },
];

const LOWER_B = [
  { name: "Trap-bar deadlift or front squat", sets: "3", reps: "4–6" },
  { name: "Hip thrust", sets: "3", reps: "8–12" },
  { name: "Leg extension", sets: "3", reps: "12–15" },
  { name: "Hamstring curl", sets: "3", reps: "10–15" },
  { name: "Walking lunges", sets: "2", reps: "12 steps each leg" },
  { name: "Calf raises", sets: "4", reps: "12–20" },
  { name: "Plank or cable crunch", sets: "3", reps: "30–45 sec / 12–15" },
];

const REST = [
  { name: "Hip flexor stretch", sets: "3", reps: "60 sec each side" },
  { name: "Hamstring stretch", sets: "3", reps: "60 sec each side" },
  { name: "Light walk", sets: "1", reps: "8,000–12,000 steps" },
];

const PROGRAM = [
  { weekDay: 0, dayName: "Rest", label: "Sunday — Rest / Active Recovery", muscleGroups: "Mobility, Steps", goal: "Recover. Light steps and stretching only.", cardio: "8,000–12,000 steps · no hard training", exercises: REST },
  { weekDay: 1, dayName: "Pull A", label: "Monday — Pull A", muscleGroups: "Lats, Rear Delts, Biceps, Core", goal: "Back width, lats, rear delts, and arm work.", cardio: "20–30 min incline walk or zone 2 after lifting", exercises: PULL_A },
  { weekDay: 2, dayName: "Push A", label: "Tuesday — Push A", muscleGroups: "Upper Chest, Shoulders, Triceps, Core", goal: "Upper chest emphasis, shoulder volume, triceps.", cardio: "20–30 min incline walk after lifting", exercises: PUSH_A },
  { weekDay: 3, dayName: "Lower A", label: "Wednesday — Lower A + Speed", muscleGroups: "Quads, Hamstrings, Glutes, Calves, Core", goal: "Leg strength plus speed block before compounds.", cardio: "Easy walking only — no long cardio after lifting", exercises: LOWER_A },
  { weekDay: 4, dayName: "Pull B", label: "Thursday — Pull B", muscleGroups: "Back, Rear Delts, Biceps, Core", goal: "Back thickness, rows, pulldowns, arms.", cardio: "20–30 min zone 2 after lifting", exercises: PULL_B },
  { weekDay: 5, dayName: "Push B", label: "Friday — Push B", muscleGroups: "Chest, Shoulders, Triceps, Core", goal: "Heavy chest, high lateral raise volume, triceps.", cardio: "20–30 min incline walk after lifting", exercises: PUSH_B },
  { weekDay: 6, dayName: "Lower B", label: "Saturday — Lower B + Conditioning", muscleGroups: "Quads, Hamstrings, Glutes, Calves, Core", goal: "Athletic legs plus conditioning finish.", cardio: "30–40 min zone 2 treadmill, bike, or walk intervals", exercises: LOWER_B },
];

async function upsertDay(day) {
  const { data: existing } = await supabase
    .from("workout_templates")
    .select("id")
    .eq("week_day", day.weekDay)
    .maybeSingle();

  const templateId = existing?.id ?? uuidv4();
  const now = new Date().toISOString();

  const row = {
    id: templateId,
    week_day: day.weekDay,
    day_name: day.dayName,
    label: day.label,
    muscle_groups: day.muscleGroups,
    goal: day.goal,
    cardio: day.cardio,
    created_at: existing ? undefined : now,
  };

  if (existing) {
    const { error } = await supabase.from("workout_templates").update({
      day_name: row.day_name,
      label: row.label,
      muscle_groups: row.muscle_groups,
      goal: row.goal,
      cardio: row.cardio,
    }).eq("id", templateId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("workout_templates").insert({ ...row, created_at: now });
    if (error) throw error;
  }

  await supabase.from("template_exercises").delete().eq("template_id", templateId);

  for (let i = 0; i < day.exercises.length; i++) {
    const e = day.exercises[i];
    const { error } = await supabase.from("template_exercises").insert({
      id: uuidv4(),
      template_id: templateId,
      name: e.name,
      sets_prescribed: e.sets,
      reps_prescribed: e.reps,
      order_idx: i,
      notes: e.notes ?? null,
    });
    if (error) throw error;
  }

  console.log(`  ✓ ${day.label} (${day.exercises.length} exercises)`);
}

async function main() {
  console.log("Syncing official workout program to Supabase…\n");
  for (const day of PROGRAM) {
    await upsertDay(day);
  }
  console.log("\n✅ Program updated! Open Workout → Program to view.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
