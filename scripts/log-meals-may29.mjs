/**
 * Log May 29, 2026 meals (Friday) to Supabase
 * Run: node scripts/log-meals-may29.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const DATE = "2026-05-29";

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

const MEALS = [
  {
    meal_type: "breakfast",
    name: "Scrambled eggs — 3 whole, 2 whites, splash of milk (pan)",
    calories: 289,
    protein: 29,
    fat: 17,
    carbs: 4,
    notes: "Milk mixed into eggs while scrambling; not a full glass",
  },
  {
    meal_type: "breakfast",
    name: "Olive oil (3 tbsp — pan for eggs)",
    calories: 360,
    protein: 0,
    fat: 42,
    carbs: 0,
    notes: "All 3 tbsp used to cook breakfast eggs",
  },
  {
    meal_type: "breakfast",
    name: "Oikos protein yogurt",
    calories: 90,
    protein: 15,
    fat: 0,
    carbs: 7,
  },
  {
    meal_type: "lunch",
    name: "Factor — Shredded Chicken Taco Bowl",
    calories: 550,
    protein: 36,
    fat: 25,
    carbs: 44,
    notes: "Label: 550 kcal, 36g P, 44g C, 25g F",
  },
  {
    meal_type: "lunch",
    name: "Protein shake — 3 scoops ON Gold Standard Whey + 500 mL Kirkland ultra-filtered 2% milk + 10g creatine",
    calories: 620,
    protein: 99,
    fat: 13,
    carbs: 22,
    notes: "Whey: 360 cal / 72g P · Milk 500mL: ~260 cal / 27g P · Creatine 10g: 0 cal",
  },
  {
    meal_type: "dinner",
    name: "Sushi — 1 small tuna nigiri + 8 small pieces",
    calories: 405,
    protein: 20,
    fat: 7,
    carbs: 61,
    notes: "Est. ~45 kcal/piece avg (rice + fish); tuna piece ~4g P",
  },
  {
    meal_type: "snack",
    name: "Chocolate cookie (1 small)",
    calories: 140,
    protein: 2,
    fat: 7,
    carbs: 18,
    notes: "Small bakery/chocolate chip cookie estimate",
  },
];

async function main() {
  console.log(`Logging meals for ${DATE} (Friday)...\n`);

  const { data: existing } = await supabase
    .from("food_entries")
    .select("id, name, meal_type")
    .eq("date", DATE);

  const manual = (existing ?? []).filter(
    (e) => !String(e.name ?? "").includes("__supplement_macro__")
  );

  if (manual.length) {
    console.log("  Removing existing manual entries for this date:");
    for (const e of manual) {
      console.log(`    - [${e.meal_type}] ${e.name}`);
      await supabase.from("food_entries").delete().eq("id", e.id);
    }
  }

  const now = new Date().toISOString();
  const totals = { calories: 0, protein: 0, fat: 0, carbs: 0 };

  for (const item of MEALS) {
    const { notes, meal_type, ...macros } = item;
    const row = {
      id: uuidv4(),
      date: DATE,
      meal_type,
      name: item.name,
      calories: macros.calories,
      protein: macros.protein,
      fat: macros.fat,
      carbs: macros.carbs,
      notes: notes ?? null,
      created_at: now,
    };
    const { error } = await supabase.from("food_entries").insert(row);
    if (error) throw error;
    totals.calories += macros.calories;
    totals.protein += macros.protein;
    totals.fat += macros.fat;
    totals.carbs += macros.carbs;
    console.log(`  ✓ [${meal_type}] ${item.name}`);
    console.log(
      `      ${macros.calories} kcal · ${macros.protein}g P · ${macros.fat}g F · ${macros.carbs}g C`
    );
  }

  console.log("\n  Logged meals total:");
  console.log(
    `    ${totals.calories} kcal · ${totals.protein}g P · ${totals.fat}g F · ${totals.carbs}g C`
  );

  const { data: allDay } = await supabase
    .from("food_entries")
    .select("calories, protein, fat, carbs, name, notes")
    .eq("date", DATE);

  const day = (allDay ?? []).reduce(
    (t, r) => ({
      calories: t.calories + Number(r.calories),
      protein: t.protein + Number(r.protein),
      fat: t.fat + Number(r.fat),
      carbs: t.carbs + Number(r.carbs),
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );

  console.log("\n  May 29 full day (meals + any supplement macros):");
  console.log(
    `    ${Math.round(day.calories)} kcal · ${Math.round(day.protein)}g P · ${Math.round(day.fat)}g F · ${Math.round(day.carbs)}g C`
  );
  console.log("\n✅ Done!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
