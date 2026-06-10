import type Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import { OFFICIAL_WORKOUT_PROGRAM } from "./workout-program";

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
    target_calories: 2200, target_protein: 200, target_fat: 55, target_carbs: 220,
    notes: "Cut to 174 lb by Aug 1. Training days: 2200 kcal / 200P / 220C / 55F. Rest days: 1950 kcal / 200P / 140C / 60F. Pull-Push-Lower split Mon–Sat. Fitness SF.",
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
// Official Workout Program (see workout-program.ts)
// ─────────────────────────────────────────────────────────────────────────────

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

  for (const day of OFFICIAL_WORKOUT_PROGRAM) {
    const tid = uuidv4();
    insertTemplate.run({
      id: tid,
      week_day: day.weekDay,
      day_name: day.dayName,
      label: day.label,
      muscle_groups: day.muscleGroups,
      goal: day.goal,
      cardio: day.cardio,
      created_at: now,
    });
    day.exercises.forEach((e, i) => {
      insertExercise.run({
        id: uuidv4(),
        template_id: tid,
        name: e.name,
        sets_prescribed: e.sets,
        reps_prescribed: e.reps,
        order_idx: i,
        notes: e.notes ?? null,
      });
    });
  }
}
