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
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i);
    const v = t.slice(i + 1);
    if (!process.env[k]) process.env[k] = v;
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
const CHEST_TRICEPS = [
  { name: "Chest flys", sets: "3", reps: "12–15" },
  { name: "Cable machine chest variations", sets: "3", reps: "10–15" },
  { name: "Tricep pushdown", sets: "4", reps: "10–15" },
  { name: "Torso rotations", sets: "3", reps: "12–15 each side", notes: "Core / obliques" },
  { name: "Bench press", sets: "4", reps: "6–10" },
  { name: "Incline machine chest press", sets: "3", reps: "8–12" },
  { name: "Forearm curls", sets: "3", reps: "12–15" },
  { name: "Overhead tricep extension", sets: "3", reps: "10–15" },
];

const PULL = [
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

const LEGS = [
  { name: "Walking lunges", sets: "3", reps: "12 steps each leg" },
  { name: "Leg curls", sets: "3", reps: "10–15" },
  { name: "Hamstring curls", sets: "3", reps: "10–15" },
  { name: "Calf raises", sets: "4", reps: "12–20" },
  { name: "Hip thrust", sets: "4", reps: "8–12" },
  { name: "Closing hip / open hip", sets: "2", reps: "10–12 each", notes: "Hip mobility" },
  { name: "Squats", sets: "4", reps: "6–10" },
  { name: "Wrist curl", sets: "3", reps: "12–15" },
  { name: "Torso rotations", sets: "3", reps: "12–15 each side" },
  { name: "Leg raises", sets: "3", reps: "10–15" },
];

const REST = [
  { name: "Hip flexor stretch", sets: "3", reps: "60 sec each side" },
  { name: "Hamstring stretch", sets: "3", reps: "60 sec each side" },
  { name: "Light walk", sets: "1", reps: "8,000–12,000 steps" },
];

const PROGRAM = [
  { weekDay: 0, dayName: "Rest", label: "Sunday — Rest / Active Recovery", muscleGroups: "Mobility, Steps", goal: "Recover. Light steps and stretching only.", cardio: "8,000–12,000 steps walking", exercises: REST },
  { weekDay: 1, dayName: "Chest + Triceps", label: "Monday — Chest + Triceps", muscleGroups: "Chest, Triceps, Forearms, Core", goal: "Chest volume, triceps, and core rotation work.", cardio: "50 min walk on active days (~200 kcal burn)", exercises: CHEST_TRICEPS },
  { weekDay: 2, dayName: "Pull", label: "Tuesday — Pull + Shoulders + Arms", muscleGroups: "Back, Rear Delts, Shoulders, Biceps, Core", goal: "Lats, deadlift strength, shoulders, and arm hypertrophy.", cardio: "50 min walk optional after lifting", exercises: PULL },
  { weekDay: 3, dayName: "Legs", label: "Wednesday — Legs", muscleGroups: "Quads, Hamstrings, Glutes, Calves, Core", goal: "Leg strength and glute focus.", cardio: "10–15 min easy walk — legs day", exercises: LEGS },
  { weekDay: 4, dayName: "Pull", label: "Thursday — Pull + Shoulders + Arms", muscleGroups: "Back, Rear Delts, Shoulders, Biceps, Core", goal: "Same as Tuesday — back width, shoulders, arms.", cardio: "50 min walk optional after lifting", exercises: PULL },
  { weekDay: 5, dayName: "Chest + Triceps", label: "Friday — Chest + Triceps", muscleGroups: "Chest, Triceps, Forearms, Core", goal: "Repeat Monday chest + triceps session.", cardio: "50 min walk on active days (~200 kcal burn)", exercises: CHEST_TRICEPS },
  { weekDay: 6, dayName: "Legs", label: "Saturday — Legs", muscleGroups: "Quads, Hamstrings, Glutes, Calves, Core", goal: "Repeat Wednesday leg session.", cardio: "10–15 min easy walk or conditioning", exercises: LEGS },
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
