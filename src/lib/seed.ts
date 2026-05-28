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
}

function seedFood(db: Database.Database) {
  const count = db.prepare("SELECT COUNT(*) as c FROM food_entries").get() as { c: number };
  if (count.c > 0) return;

  const now = new Date().toISOString();
  const insert = db.prepare(
    `INSERT INTO food_entries (id, date, meal_type, name, calories, protein, fat, carbs, notes, created_at)
     VALUES (@id, @date, @meal_type, @name, @calories, @protein, @fat, @carbs, @notes, @created_at)`
  );

  const breakfastItems = [
    { name: "3 large eggs", calories: 210, protein: 18, fat: 15, carbs: 1 },
    { name: "1 tbsp olive oil", calories: 120, protein: 0, fat: 14, carbs: 0 },
    { name: "2 egg whites", calories: 34, protein: 7, fat: 0, carbs: 0 },
    { name: "50% more protein milk (5 tbsp / ~75mL)", calories: 40, protein: 4, fat: 1.5, carbs: 2 },
    { name: "Oikos Triple Zero (15g protein)", calories: 95, protein: 15, fat: 0, carbs: 5 },
  ];

  for (const item of breakfastItems) {
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
    id: uuidv4(),
    date: INBODY_DATE,
    weight_lbs: 186.9,
    body_fat_pct: 20.9,
    muscle_mass_lbs: 83.0,
    skeletal_muscle_lbs: 85.1,
    bmi: 29.7,
    visceral_fat: 75.1,
    inbody_score: 88,
    body_water_pct: 73.2,
    bmr: 1819,
    notes: "InBody 580 — InBody Score 88. Segmental: Trunk lean 65.3 lb (113.8%), L.Arm 8.82 lb (122.7%), R.Arm 8.58 lb (119.3%), L.Leg 19.91 lb, R.Leg 19.97 lb. Trunk fat 22.0 lb (252.2%). Phase angle 7.1°. FFMI 23.5. Suggested: lose 13 lb fat, keep muscle.",
    created_at: new Date().toISOString(),
  });
}

function seedPhotos(db: Database.Database) {
  const count = db.prepare("SELECT COUNT(*) as c FROM photos").get() as { c: number };
  if (count.c > 0) return;

  const now = new Date().toISOString();
  const insert = db.prepare(
    `INSERT INTO photos (id, date, category, filename, caption, created_at)
     VALUES (@id, @date, @category, @filename, @caption, @created_at)`
  );

  const photos = [
    { date: FOOD_DATE, category: "body", filename: "progress-2026-05-28-1.png", caption: "May 28 — front mirror" },
    { date: FOOD_DATE, category: "body", filename: "progress-2026-05-28-2.png", caption: "May 28 — bicep flex" },
    { date: FOOD_DATE, category: "body", filename: "progress-2026-05-28-3.png", caption: "May 28 — front" },
  ];

  for (const p of photos) {
    insert.run({ id: uuidv4(), ...p, created_at: now });
  }
}

function seedProfile(db: Database.Database) {
  const count = db.prepare("SELECT COUNT(*) as c FROM user_profile").get() as { c: number };
  if (count.c > 0) return;

  db.prepare(
    `INSERT INTO user_profile
     (id, name, age, height, goal, avatar_filename,
      target_calories, target_protein, target_fat, target_carbs, notes, updated_at)
     VALUES (@id, @name, @age, @height, @goal, @avatar_filename,
      @target_calories, @target_protein, @target_fat, @target_carbs, @notes, @updated_at)`
  ).run({
    id: "me",
    name: "Allahu",
    age: 23,
    height: "5′6.5″",
    goal: "Cut — lose 13 lb fat, keep muscle (→ ~174 lb @ 14–16% BF)",
    avatar_filename: "profile-avatar.png",
    target_calories: 2200,
    target_protein: 160,
    target_fat: 65,
    target_carbs: 180,
    notes: "InBody Score 88. Upper body dominant. Main target: trunk fat. Current: 186.9 lb / 20.9% BF / 85.1 lb SMM.",
    updated_at: new Date().toISOString(),
  });
}

function seedSupplements(db: Database.Database) {
  const count = db.prepare("SELECT COUNT(*) as c FROM supplements").get() as { c: number };
  if (count.c > 0) return;

  const now = new Date().toISOString();
  const insert = db.prepare(
    `INSERT INTO supplements (id, name, brand, dose, category, timing, notes, active, created_at)
     VALUES (@id, @name, @brand, @dose, @category, @timing, @notes, @active, @created_at)`
  );

  const stack = [
    { name: "Zinc", brand: "Nature's Bounty", dose: "50 mg", category: "mineral", timing: "With food", notes: "Immune health" },
    { name: "Magnesium Glycinate", brand: "Nature's Bounty", dose: "240 mg", category: "mineral", timing: "Before bed", notes: "High absorption — muscle, heart, nerve health" },
    { name: "Omega-3 Fish Oil", brand: "Spring Valley", dose: "1,000 mg", category: "omega", timing: "With meal", notes: "Heart & inflammation support" },
    { name: "L-Citrulline", brand: "Bulk Supplements", dose: "3,000 mg", category: "amino_acid", timing: "Pre-workout", notes: "240 caps / 30 servings — pump & endurance" },
    { name: "Vitamin D3", brand: "Viva Naturals", dose: "5,000 IU", category: "vitamin", timing: "Morning with fat", notes: "Liquid in coconut oil — bone & immune health" },
    { name: "Magnesium + Vitamin B6", brand: "PONutrí", dose: "Per label", category: "mineral", timing: "Daily", notes: "Supports muscle and nerve function" },
    { name: "Vitamin K2", brand: "Spring Valley", dose: "100 mcg", category: "vitamin", timing: "With D3", notes: "Bone support — 60 softgels" },
    { name: "Creatine Monohydrate", brand: "Nutricost Performance", dose: "5 g", category: "performance", timing: "Daily (any time)", notes: "Micronized, unflavored — 60 servings / 300g" },
    { name: "Gold Standard 100% Whey", brand: "Optimum Nutrition", dose: "~24 g protein per scoop", category: "protein", timing: "Post-workout / any time", notes: "Vanilla Ice Cream — 5.47 lb / 80 servings, 5.5g BCAAs" },
    { name: "Quest Protein Bars", brand: "Quest", dose: "~20–21 g protein", category: "protein", timing: "Snack / on-the-go", notes: "Variety pack — chocolate chip cookie dough & others" },
  ];

  for (const s of stack) {
    insert.run({ id: uuidv4(), ...s, active: 1, created_at: now });
  }
}
