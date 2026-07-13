/**
 * Sync official workout program to Supabase (all 7 days)
 * Run: node scripts/sync-workout-program.mjs
 * Keep exercise lists in sync with src/lib/workout-program.ts
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

const PULL_A = [
  { name: "Pull-ups or assisted pull-ups", sets: "4", reps: "6–10" },
  { name: "Diverging lat pulldown", sets: "4", reps: "8–12", notes: "Primary width — full stretch at top" },
  { name: "Lat pulldown (standard / wide)", sets: "3", reps: "8–12" },
  { name: "Chest-supported row", sets: "3", reps: "8–12" },
  { name: "Single-arm cable lat row", sets: "2", reps: "10–15 each" },
  { name: "Rear delt machine", sets: "4", reps: "15–20", notes: "Machine rear delt — controlled" },
  { name: "Incline dumbbell curl", sets: "3", reps: "8–12" },
  { name: "Hammer curl", sets: "2", reps: "10–15" },
  { name: "Cable crunch", sets: "3", reps: "12–15" },
];

const PUSH_A = [
  { name: "Incline Smith or DB press", sets: "4", reps: "6–10" },
  { name: "Flat machine chest press", sets: "3", reps: "8–12" },
  { name: "Cable fly (low-to-high)", sets: "3", reps: "12–15", notes: "Upper-chest bias" },
  { name: "Pec deck or machine fly", sets: "3", reps: "12–15", notes: "Your fly volume — squeeze at peak" },
  { name: "Cable chest press / cable crossover", sets: "2", reps: "12–15", notes: "Cable machine chest day staple" },
  { name: "Seated shoulder press", sets: "3", reps: "6–10" },
  { name: "Cable lateral raise", sets: "4", reps: "12–20" },
  { name: "Rear delt machine", sets: "3", reps: "15–20", notes: "Balance pressing volume" },
  { name: "Rope triceps pushdown", sets: "3", reps: "10–15" },
  { name: "Ab wheel", sets: "3", reps: "8–12" },
];

const LOWER_A = [
  { name: "Pogo jumps", sets: "2", reps: "20" },
  { name: "A-skips", sets: "2", reps: "20 m" },
  { name: "Accelerations", sets: "6", reps: "8–10 sec", notes: "90–150 s rest — quality, not conditioning" },
  { name: "Back squat", sets: "4", reps: "5–8", notes: "Priority compound" },
  { name: "Walking lunges", sets: "4", reps: "12–16 steps each", notes: "Extra lunge volume — your preference" },
  { name: "Bulgarian split squat", sets: "3", reps: "8–12 each" },
  { name: "Romanian deadlift", sets: "3", reps: "6–10" },
  { name: "Leg curl", sets: "3", reps: "10–15" },
  { name: "Standing calf raise", sets: "4", reps: "10–15" },
  { name: "Cable crunch", sets: "3", reps: "12–15" },
];

const PULL_B = [
  { name: "T-bar or supported machine row", sets: "4", reps: "6–10" },
  { name: "Diverging lat pulldown", sets: "3", reps: "8–12" },
  { name: "Lat pulldown (close / neutral)", sets: "3", reps: "8–12" },
  { name: "Seated cable row", sets: "3", reps: "10–12" },
  { name: "Straight-arm pulldown", sets: "2", reps: "12–15" },
  { name: "Rear delt machine / face pull", sets: "3", reps: "15–20" },
  { name: "Preacher curl", sets: "3", reps: "8–12" },
  { name: "Reverse curl", sets: "2", reps: "12–15" },
  { name: "Stomach vacuum", sets: "4", reps: "20–30 sec" },
];

const PUSH_B = [
  { name: "Flat bench press", sets: "3", reps: "5–8" },
  { name: "Incline machine press", sets: "3", reps: "8–12" },
  { name: "Cable fly / pec deck fly", sets: "3", reps: "12–15", notes: "Fly-heavy chest day" },
  { name: "Cable machine chest press", sets: "3", reps: "10–15" },
  { name: "Machine shoulder press", sets: "2", reps: "8–12" },
  { name: "DB or machine lateral raise", sets: "4", reps: "15–25" },
  { name: "Rear delt machine", sets: "3", reps: "15–20" },
  { name: "Triceps pushdown", sets: "3", reps: "10–15" },
  { name: "Hanging leg raise", sets: "3", reps: "10–15" },
];

const LOWER_B = [
  { name: "Box jumps", sets: "3", reps: "3" },
  { name: "5-10-5 shuttle", sets: "4", reps: "full recovery" },
  { name: "Trap-bar deadlift", sets: "3", reps: "4–6" },
  { name: "Front squat or hack squat", sets: "3", reps: "6–10", notes: "Second squat pattern of the week" },
  { name: "Walking lunges", sets: "4", reps: "12–16 steps each", notes: "High lunge volume" },
  { name: "Hip thrust", sets: "3", reps: "8–12" },
  { name: "Hamstring curl", sets: "3", reps: "10–15" },
  { name: "Seated calf raise", sets: "3", reps: "12–20" },
  { name: "Pallof press", sets: "3", reps: "10–15 each" },
];

const REST = [
  { name: "Zone 2 walk / bike", sets: "1", reps: "50–70 min" },
  { name: "Hip flexor stretch", sets: "2", reps: "45 sec each" },
  { name: "Hamstring stretch", sets: "2", reps: "45 sec each" },
  { name: "Dead bug", sets: "3", reps: "8 each" },
  { name: "Front plank", sets: "3", reps: "30–45 sec" },
];

const PROGRAM = [
  { weekDay: 0, dayName: "Rest", label: "Sunday — Cardio / Recovery", muscleGroups: "Mobility, Steps", goal: "Recover. 12–15k steps. Optional sauna.", cardio: "50–70 min Zone 2 · 12,000–15,000 steps", exercises: REST },
  { weekDay: 1, dayName: "Pull A", label: "Monday — Back width (diverging + lat)", muscleGroups: "Lats, Rear Delts, Biceps, Core", goal: "Diverging lat + standard lat for width; rear delt machine.", cardio: "25–30 min incline walk / Zone 2", exercises: PULL_A },
  { weekDay: 2, dayName: "Push A", label: "Tuesday — Chest (fly + cable)", muscleGroups: "Upper Chest, Shoulders, Triceps, Core", goal: "Fly + cable chest focus, rear delt machine for balance.", cardio: "20–25 min Zone 2", exercises: PUSH_A },
  { weekDay: 3, dayName: "Lower A", label: "Wednesday — Squat + lunges + speed", muscleGroups: "Quads, Hamstrings, Glutes, Calves", goal: "Back squat priority + high walking-lunge volume.", cardio: "Easy walking only — hit steps", exercises: LOWER_A },
  { weekDay: 4, dayName: "Pull B", label: "Thursday — Back thickness", muscleGroups: "Back, Rear Delts, Biceps, Core", goal: "Rows + diverging/standard lat + rear delt machine.", cardio: "30–35 min Zone 2", exercises: PULL_B },
  { weekDay: 5, dayName: "Push B", label: "Friday — Chest fly + cables", muscleGroups: "Chest, Shoulders, Triceps, Core", goal: "Second fly/cable chest day; rear delts again.", cardio: "25–30 min Zone 2", exercises: PUSH_B },
  { weekDay: 6, dayName: "Lower B", label: "Saturday — Athletic legs + lunges", muscleGroups: "Quads, Hamstrings, Glutes, Calves", goal: "Agility + squat pattern + heavy lunge volume.", cardio: "Optional 10 min easy cooldown", exercises: LOWER_B },
];

async function upsertDay(day) {
  const { data: existing } = await supabase
    .from("workout_templates")
    .select("id")
    .eq("week_day", day.weekDay)
    .maybeSingle();

  const templateId = existing?.id ?? uuidv4();
  const now = new Date().toISOString();

  if (existing) {
    const { error } = await supabase.from("workout_templates").update({
      day_name: day.dayName,
      label: day.label,
      muscle_groups: day.muscleGroups,
      goal: day.goal,
      cardio: day.cardio,
    }).eq("id", templateId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("workout_templates").insert({
      id: templateId,
      week_day: day.weekDay,
      day_name: day.dayName,
      label: day.label,
      muscle_groups: day.muscleGroups,
      goal: day.goal,
      cardio: day.cardio,
      created_at: now,
    });
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
  console.log("Syncing workout program (fly / lat / lunges / squat)…\n");
  for (const day of PROGRAM) await upsertDay(day);
  console.log("\n✅ Program updated.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
