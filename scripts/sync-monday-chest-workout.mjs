/**
 * Update Monday chest program + log Jun 8–9 water & Jun 9 workout/walk
 * Run: node scripts/sync-monday-chest-workout.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const MONDAY = 1;
const JUNE_8 = "2026-06-08";
const JUNE_9 = "2026-06-09";
const WATER_ML = 4000;
const WALK_MIN = 50;

const MONDAY_EXERCISES = [
  { name: "Bench press", sets: "4", reps: "6–10" },
  { name: "Incline machine chest press", sets: "3", reps: "8–12" },
  { name: "Chest flys", sets: "3", reps: "12–15" },
  { name: "Cable machine chest variations", sets: "3", reps: "10–15" },
  { name: "Tricep pushdown", sets: "4", reps: "10–15" },
  { name: "Overhead tricep extension", sets: "3", reps: "10–15" },
  { name: "Forearm curls", sets: "3", reps: "12–15" },
  { name: "Torso rotations", sets: "3", reps: "12–15 each side", notes: "Core / obliques" },
];

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

async function updateMondayTemplate() {
  const { data: template, error } = await supabase
    .from("workout_templates")
    .select("*")
    .eq("week_day", MONDAY)
    .maybeSingle();

  if (error) throw error;
  if (!template) throw new Error("No Monday template found");

  console.log(`\nUpdating Monday template (${template.id})…`);

  await supabase.from("workout_templates").update({
    day_name: "Chest + Triceps",
    label: "Monday — Chest + Triceps",
    muscle_groups: "Chest, Triceps, Forearms, Core",
    goal: "Chest volume + triceps. Flys, cables, bench & incline press.",
    cardio: `${WALK_MIN} min walk — active day (~200 kcal burn, use workout-day macros)`,
  }).eq("id", template.id);

  await supabase.from("template_exercises").delete().eq("template_id", template.id);

  for (let i = 0; i < MONDAY_EXERCISES.length; i++) {
    const e = MONDAY_EXERCISES[i];
    const { error: insErr } = await supabase.from("template_exercises").insert({
      id: uuidv4(),
      template_id: template.id,
      name: e.name,
      sets_prescribed: e.sets,
      reps_prescribed: e.reps,
      order_idx: i,
      notes: e.notes ?? null,
    });
    if (insErr) throw insErr;
    console.log(`  ✓ ${e.name}`);
  }

  return template;
}

async function setWater(date) {
  await supabase.from("water_logs").delete().eq("date", date);
  const { error } = await supabase.from("water_logs").insert({
    id: uuidv4(),
    date,
    amount_ml: WATER_ML,
    created_at: new Date().toISOString(),
  });
  if (error) throw error;
  console.log(`  ✓ Water ${date}: ${WATER_ML / 1000}L`);
}

async function logWorkoutSession(template) {
  const { data: existing } = await supabase
    .from("workout_sessions")
    .select("id")
    .eq("date", JUNE_9);

  if (existing?.length) {
    for (const s of existing) {
      await supabase.from("session_exercises").delete().eq("session_id", s.id);
      await supabase.from("workout_sessions").delete().eq("id", s.id);
    }
  }

  const sessionId = uuidv4();
  const now = new Date().toISOString();

  await supabase.from("workout_sessions").insert({
    id: sessionId,
    date: JUNE_9,
    template_id: template.id,
    name: "Monday — Chest + Triceps (done Tuesday)",
    duration_min: 60,
    cardio_done: 1,
    cardio_min: WALK_MIN,
    notes: `Performed Monday program on Tue ${JUNE_9}. ${WALK_MIN} min walk. ~200 kcal activity burn.`,
    created_at: now,
  });

  for (let i = 0; i < MONDAY_EXERCISES.length; i++) {
    const e = MONDAY_EXERCISES[i];
    await supabase.from("session_exercises").insert({
      id: uuidv4(),
      session_id: sessionId,
      template_exercise_id: null,
      name: e.name,
      sets_prescribed: e.sets,
      reps_prescribed: e.reps,
      sets_data: "[]",
      order_idx: i,
      notes: e.notes ?? null,
    });
  }

  console.log(`  ✓ Workout session ${JUNE_9}: Chest + Triceps + ${WALK_MIN} min walk`);
}

async function updateProfileGoals() {
  // Slightly lower workout-day calories for cut + activity days
  const { error } = await supabase.from("user_profile").upsert(
    {
      id: "me",
      target_calories: 2200,
      target_protein: 200,
      target_fat: 57,
      target_carbs: 200,
      notes:
        "Cut targets updated Jun 9: workout days 2200 kcal (was 2300). 50 min walk ≈ 200 kcal burn — eat toward lower end on lift+walk days.",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  if (error) console.warn("  profile update:", error.message);
  else console.log("  ✓ Profile targets: 2200 cal / 200g P (workout-day cut)");
}

async function main() {
  console.log("Syncing Monday chest program + Jun 8–9 activity…");

  const template = await updateMondayTemplate();

  console.log("\nWater:");
  await setWater(JUNE_8);
  await setWater(JUNE_9);

  console.log("\nWorkout:");
  await logWorkoutSession(template);

  console.log("\nMacro targets:");
  await updateProfileGoals();

  console.log("\n✅ Done! Check Workout page for Mon program & Tue session.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
