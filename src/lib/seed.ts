import type Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";

const FOOD_DATE = "2026-05-28";
const INBODY_DATE = "2026-05-22";

export function seedDatabase(db: Database.Database) {
  seedFood(db);
  seedInBody(db);
  seedPhotos(db);
  seedProfile(db);
  seedSupplements(db);
  seedWorkoutProgram(db);
}

function seedFood(db: Database.Database) {
  const count = db.prepare("SELECT COUNT(*) as c FROM food_entries").get() as { c: number };
  if (count.c > 0) return;
  const now = new Date().toISOString();
  const insert = db.prepare(
    `INSERT INTO food_entries (id, date, meal_type, name, calories, protein, fat, carbs, notes, created_at)
     VALUES (@id, @date, @meal_type, @name, @calories, @protein, @fat, @carbs, @notes, @created_at)`
  );
  for (const item of [
    { name: "3 large eggs", calories: 210, protein: 18, fat: 15, carbs: 1 },
    { name: "1 tbsp olive oil", calories: 120, protein: 0, fat: 14, carbs: 0 },
    { name: "2 egg whites", calories: 34, protein: 7, fat: 0, carbs: 0 },
    { name: "50% more protein milk (5 tbsp / ~75mL)", calories: 40, protein: 4, fat: 1.5, carbs: 2 },
    { name: "Oikos Triple Zero (15g protein)", calories: 95, protein: 15, fat: 0, carbs: 5 },
  ]) {
    insert.run({ id: uuidv4(), date: FOOD_DATE, meal_type: "breakfast", ...item, notes: null, created_at: now });
  }
}

function seedInBody(db: Database.Database) {
  const count = db.prepare("SELECT COUNT(*) as c FROM body_metrics").get() as { c: number };
  if (count.c > 0) return;
  db.prepare(
    `INSERT INTO body_metrics
     (id, date, weight_lbs, body_fat_pct, muscle_mass_lbs, skeletal_muscle_lbs,
      bmi, visceral_fat, inbody_score, body_water_pct, bmr, notes, created_at)
     VALUES (@id, @date, @weight_lbs, @body_fat_pct, @muscle_mass_lbs, @skeletal_muscle_lbs,
      @bmi, @visceral_fat, @inbody_score, @body_water_pct, @bmr, @notes, @created_at)`
  ).run({
    id: uuidv4(), date: INBODY_DATE, weight_lbs: 186.9, body_fat_pct: 20.9,
    muscle_mass_lbs: 83.0, skeletal_muscle_lbs: 85.1, bmi: 29.7, visceral_fat: 75.1,
    inbody_score: 88, body_water_pct: 73.2, bmr: 1819,
    notes: "InBody 580 — Score 88. Trunk lean 65.3 lb (113.8%), L.Arm 8.82 lb (122.7%), R.Arm 8.58 lb (119.3%). Trunk fat 22 lb (252%). Phase angle 7.1°. FFMI 23.5. Target: -13 lb fat.",
    created_at: new Date().toISOString(),
  });
}

function seedPhotos(db: Database.Database) {
  const count = db.prepare("SELECT COUNT(*) as c FROM photos").get() as { c: number };
  if (count.c > 0) return;
  const now = new Date().toISOString();
  const insert = db.prepare(
    `INSERT INTO photos (id, date, category, filename, caption, created_at) VALUES (@id, @date, @category, @filename, @caption, @created_at)`
  );
  for (const p of [
    { date: FOOD_DATE, category: "body", filename: "progress-2026-05-28-1.png", caption: "May 28 — front mirror" },
    { date: FOOD_DATE, category: "body", filename: "progress-2026-05-28-2.png", caption: "May 28 — bicep flex" },
    { date: FOOD_DATE, category: "body", filename: "progress-2026-05-28-3.png", caption: "May 28 — front" },
  ]) { insert.run({ id: uuidv4(), ...p, created_at: now }); }
}

function seedProfile(db: Database.Database) {
  const count = db.prepare("SELECT COUNT(*) as c FROM user_profile").get() as { c: number };
  if (count.c > 0) return;
  db.prepare(
    `INSERT INTO user_profile (id, name, age, height, goal, avatar_filename, target_calories, target_protein, target_fat, target_carbs, notes, updated_at)
     VALUES (@id, @name, @age, @height, @goal, @avatar_filename, @target_calories, @target_protein, @target_fat, @target_carbs, @notes, @updated_at)`
  ).run({
    id: "me", name: "Allahu", age: 23, height: "5′6.5″",
    goal: "Cut — 187 lb → 174–176 lb @ 14–16% BF (8–10 weeks · 1.5 lb/week)",
    avatar_filename: "profile-avatar.png",
    target_calories: 2250, target_protein: 200, target_fat: 61, target_carbs: 200,
    notes: "InBody Score 88. Upper body dominant. Main target: trunk fat. Current: 189.6 lb / 24% BF / 85.1 lb SMM. Fitness SF trainer. PPL Mon–Sat + 1hr treadmill daily.",
    updated_at: new Date().toISOString(),
  });
}

function seedSupplements(db: Database.Database) {
  const count = db.prepare("SELECT COUNT(*) as c FROM supplements").get() as { c: number };
  if (count.c > 0) return;
  const now = new Date().toISOString();
  const insert = db.prepare(
    `INSERT INTO supplements (id, name, brand, dose, category, timing, frequency, notes, active, created_at)
     VALUES (@id, @name, @brand, @dose, @category, @timing, @frequency, @notes, @active, @created_at)`
  );
  for (const s of [
    { name: "Vitamin D3", brand: "Viva Naturals", dose: "5,000 IU", category: "vitamin", timing: "Morning with breakfast + fat", notes: "Liquid in coconut oil — bone & immune" },
    { name: "Vitamin K2", brand: "Spring Valley", dose: "100 mcg", category: "vitamin", timing: "Morning with D3", notes: "60 softgels — bone support, pairs with D3" },
    { name: "Zinc", brand: "Nature's Bounty", dose: "50 mg", category: "mineral", frequency: "every_2_days", timing: "Every 2 days with breakfast", notes: "Immune health — take with food. Every 2 days only (not daily)." },
    { name: "Omega-3 Fish Oil", brand: "Spring Valley", dose: "1,000 mg", category: "omega", timing: "Morning with meal", notes: "Heart & inflammation — take with fattest meal" },
    { name: "Magnesium + Vitamin B6", brand: "PONutrí", dose: "Per label", category: "mineral", timing: "Evening or pre-bed", notes: "Nerve & muscle support + B6 absorption boost" },
    { name: "L-Citrulline", brand: "Bulk Supplements", dose: "3,000 mg", category: "amino_acid", timing: "30–45 min pre-workout", notes: "Pump & endurance — 240 caps / 30 servings" },
    { name: "Creatine Monohydrate", brand: "Nutricost Performance", dose: "5 g", category: "performance", timing: "Post-workout (or any time daily)", notes: "Micronized, unflavored — consistency matters, not timing" },
    { name: "Gold Standard 100% Whey", brand: "Optimum Nutrition", dose: "1–2 scoops (~24–48g protein)", category: "protein", timing: "Post-workout or as needed to hit 200g protein", notes: "Vanilla Ice Cream — 5.5g BCAAs per scoop" },
    { name: "Quest Protein Bars", brand: "Quest", dose: "1 bar (~20g protein)", category: "protein", timing: "Snack — mid-morning or afternoon", notes: "Variety pack — good for hitting protein on the go" },
    { name: "Magnesium Glycinate", brand: "Nature's Bounty", dose: "240 mg", category: "mineral", timing: "30–60 min before bed", notes: "High absorption — sleep, muscle recovery, nervous system" },
  ]) { insert.run({ id: uuidv4(), ...s, frequency: (s as { frequency?: string }).frequency ?? "daily", active: 1, created_at: now }); }
}

// ─────────────────────────────────────────────────────────────────────────────
// PPL Workout Program Seed
// ─────────────────────────────────────────────────────────────────────────────

type ExerciseDef = { name: string; sets: string; reps: string; notes?: string };

function seedWorkoutProgram(db: Database.Database) {
  const count = db.prepare("SELECT COUNT(*) as c FROM workout_templates").get() as { c: number };
  if (count.c > 0) return;

  const now = new Date().toISOString();
  const insertTemplate = db.prepare(
    `INSERT INTO workout_templates (id, week_day, day_name, label, muscle_groups, goal, cardio, created_at)
     VALUES (@id, @week_day, @day_name, @label, @muscle_groups, @goal, @cardio, @created_at)`
  );
  const insertExercise = db.prepare(
    `INSERT INTO template_exercises (id, template_id, name, sets_prescribed, reps_prescribed, order_idx, notes)
     VALUES (@id, @template_id, @name, @sets_prescribed, @reps_prescribed, @order_idx, @notes)`
  );

  function addTemplate(
    weekDay: number,
    dayName: string,
    label: string,
    muscleGroups: string,
    goal: string,
    cardio: string,
    exercises: ExerciseDef[]
  ) {
    const tid = uuidv4();
    insertTemplate.run({ id: tid, week_day: weekDay, day_name: dayName, label, muscle_groups: muscleGroups, goal, cardio, created_at: now });
    exercises.forEach((e, i) => {
      insertExercise.run({ id: uuidv4(), template_id: tid, name: e.name, sets_prescribed: e.sets, reps_prescribed: e.reps, order_idx: i, notes: e.notes ?? null });
    });
  }

  // Monday — Pull A
  addTemplate(1, "Pull A", "Monday — Pull A: Back Width + Biceps",
    "Lats, Upper Back, Rear Delts, Biceps, Core",
    "Wider lats & V-shape. Priority: pull-ups, lat pulldown, rear delts.",
    "20–30 min incline treadmill walk after lifting",
    [
      { name: "Pull-ups / Assisted Pull-ups", sets: "4", reps: "6–10", notes: "V-taper priority — full ROM, dead hang" },
      { name: "Lat Pulldown (wide grip)", sets: "4", reps: "8–12", notes: "Lean back slightly, drive elbows to hips" },
      { name: "Chest-Supported Row", sets: "4", reps: "8–12", notes: "Eliminate momentum, squeeze at top" },
      { name: "Single-Arm Cable Lat Pulldown", sets: "3", reps: "10–15 each side", notes: "Full stretch at top" },
      { name: "Seated Cable Row", sets: "3", reps: "10–12", notes: "Elbows tucked, pull to navel" },
      { name: "Rear Delt Fly", sets: "4", reps: "12–20", notes: "Light weight, feel the squeeze" },
      { name: "Barbell / EZ-Bar Curl", sets: "3", reps: "8–12", notes: "Slow eccentric (3 sec down)" },
      { name: "Hammer Curls", sets: "3", reps: "10–15", notes: "Neutral grip, keep elbows fixed" },
      { name: "Hanging Knee Raises", sets: "3", reps: "10–15", notes: "Core/abs finisher" },
    ]
  );

  // Tuesday — Push A
  addTemplate(2, "Push A", "Tuesday — Push A: Chest + Shoulders + Triceps",
    "Upper Chest, Front/Side Delts, Triceps, Core",
    "Upper chest fullness, round shoulders, bigger arms.",
    "20 min incline treadmill walk after lifting",
    [
      { name: "Incline Bench Press", sets: "4", reps: "6–10", notes: "Upper chest priority — 30–45° incline" },
      { name: "Flat Dumbbell Bench Press", sets: "3", reps: "8–12", notes: "Full stretch at bottom" },
      { name: "Machine Chest Press", sets: "3", reps: "8–12", notes: "Squeeze hard at lockout" },
      { name: "Cable Fly (low-to-high)", sets: "3", reps: "12–15", notes: "Upper chest emphasis" },
      { name: "Dumbbell Lateral Raises", sets: "5", reps: "12–20", notes: "V-taper key — slight forward lean, lead with elbow" },
      { name: "Shoulder Press Machine / DB Press", sets: "3", reps: "8–12", notes: "Overhead strength" },
      { name: "Triceps Rope Pushdown", sets: "4", reps: "10–15", notes: "Spread the rope at the bottom" },
      { name: "Overhead Cable Triceps Extension", sets: "3", reps: "10–15", notes: "Long head stretch" },
      { name: "Plank", sets: "3", reps: "45–60 sec", notes: "Stay tight — no sagging hips" },
    ]
  );

  // Wednesday — Legs A
  addTemplate(3, "Legs A", "Wednesday — Legs A: Quads + Glutes + Calves",
    "Quads, Glutes, Hamstrings, Calves, Core",
    "Athletic legs without destroying recovery. Keep intensity manageable.",
    "10–15 min easy walk only — legs need recovery",
    [
      { name: "Back Squat", sets: "4", reps: "5–8", notes: "Priority strength movement — brace hard" },
      { name: "Leg Press", sets: "4", reps: "10–15", notes: "Full ROM, don't lock out" },
      { name: "Bulgarian Split Squat", sets: "3", reps: "8–12 each leg", notes: "Rear foot elevated — glute & quad" },
      { name: "Leg Extension", sets: "3", reps: "12–15", notes: "Slow tempo — squeeze at top" },
      { name: "Romanian Deadlift", sets: "3", reps: "8–10", notes: "Hinge, feel hamstring stretch" },
      { name: "Seated / Lying Hamstring Curl", sets: "3", reps: "10–15", notes: "Slow eccentric" },
      { name: "Standing Calf Raise", sets: "5", reps: "10–15", notes: "Full ROM — heel below platform" },
      { name: "Cable Crunch", sets: "3", reps: "12–15", notes: "Core finisher — abs" },
    ]
  );

  // Thursday — Pull B
  addTemplate(4, "Pull B", "Thursday — Pull B: Back Thickness + Rear Delts",
    "Upper Back Thickness, Lats, Rear Delts, Biceps",
    "Thick upper back + lats. Heavier compound movements.",
    "25–35 min incline treadmill walk after lifting",
    [
      { name: "Deadlift / Rack Pull", sets: "3", reps: "3–6", notes: "Heaviest lift of the week — full tension" },
      { name: "Neutral-Grip Pull-ups / Pulldown", sets: "4", reps: "8–12", notes: "Neutral grip hits lats differently" },
      { name: "Barbell Row / T-Bar Row", sets: "4", reps: "6–10", notes: "Thickness builder — pull to lower chest" },
      { name: "Machine Row (elbows tucked)", sets: "3", reps: "10–12", notes: "Scapular retraction focus" },
      { name: "Straight-Arm Pulldown", sets: "4", reps: "12–15", notes: "Lat isolation — arms straight throughout" },
      { name: "Face Pulls", sets: "4", reps: "15–20", notes: "Rear delt + rotator cuff health" },
      { name: "Incline Dumbbell Curls", sets: "3", reps: "10–12", notes: "Long head stretch — great for peak" },
      { name: "Cable Curls", sets: "3", reps: "12–15", notes: "Constant tension" },
      { name: "Reverse Curls", sets: "3", reps: "12–15", notes: "Brachialis + forearms" },
    ]
  );

  // Friday — Push B
  addTemplate(5, "Push B", "Friday — Push B: Shoulders Focus + Upper Chest",
    "Side Delts, Rear Delts, Upper Chest, Triceps, Core",
    "Maximum V-taper look. Shoulders are the priority today.",
    "20–30 min incline treadmill walk after lifting",
    [
      { name: "Overhead Press / Shoulder Press Machine", sets: "4", reps: "6–10", notes: "Shoulder strength base" },
      { name: "Incline Dumbbell Press", sets: "4", reps: "8–12", notes: "Upper chest — slightly different angle than Tues" },
      { name: "Weighted / Assisted Dips", sets: "3", reps: "8–12", notes: "Lean forward slightly for chest emphasis" },
      { name: "Pec Deck / Cable Fly", sets: "3", reps: "12–15", notes: "Squeeze hard — full stretch" },
      { name: "Cable Lateral Raises", sets: "5", reps: "12–20 each side", notes: "V-taper key — unilateral cable is constant tension" },
      { name: "Rear Delt Machine Fly", sets: "4", reps: "15–20", notes: "High reps — feel the squeeze" },
      { name: "Close-Grip Bench / Machine Press", sets: "3", reps: "8–10", notes: "Triceps mass builder" },
      { name: "Rope Pushdowns", sets: "3", reps: "12–15", notes: "Spread at bottom, squeeze" },
      { name: "Ab Wheel / Dead Bug", sets: "3", reps: "8–12", notes: "Core strength + anti-extension" },
    ]
  );

  // Saturday — Legs B + Conditioning
  addTemplate(6, "Legs B", "Saturday — Legs B + Athletic Conditioning",
    "Hamstrings, Glutes, Calves, Core, Cardio Conditioning",
    "Hamstrings, glutes, calves, fat loss, rugby/cardio performance.",
    "Choose: 30–45 min incline walk OR 10 rounds 20sec sprint/100sec walk OR 20 min Stairmaster",
    [
      { name: "Romanian Deadlift", sets: "4", reps: "6–10", notes: "Hamstring focus — feel the stretch" },
      { name: "Front Squat / Goblet Squat", sets: "4", reps: "8–12", notes: "Quad emphasis, more upright torso" },
      { name: "Walking Lunges", sets: "3", reps: "12 steps each leg", notes: "Glute & quad — add weight when ready" },
      { name: "Hamstring Curl", sets: "4", reps: "10–15", notes: "Slow eccentric, feel the burn" },
      { name: "Hip Thrust", sets: "3", reps: "8–12", notes: "Glute activation — squeeze at top" },
      { name: "Seated Calf Raise", sets: "5", reps: "12–20", notes: "Soleus — slow reps" },
      { name: "Tibialis Raises", sets: "3", reps: "15–20", notes: "Shin strength — injury prevention for running/rugby" },
      { name: "Hanging Leg Raises", sets: "3", reps: "10–15", notes: "Lower abs finisher" },
    ]
  );

  // Sunday — Rest
  addTemplate(0, "Rest", "Sunday — Active Recovery",
    "Full Body Mobility",
    "8k–12k steps, stretch, no hard lifting.",
    "8,000–12,000 steps walking only",
    [
      { name: "Hip flexor stretch", sets: "3", reps: "60 sec each side", notes: "Couch stretch works best" },
      { name: "Hamstring stretch", sets: "3", reps: "60 sec each side", notes: "" },
      { name: "Lat / chest stretch", sets: "3", reps: "45 sec", notes: "" },
      { name: "Foam roll upper back", sets: "1", reps: "3–5 min", notes: "" },
    ]
  );
}
