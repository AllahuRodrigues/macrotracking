/**
 * Log May 30–31 weekend + June 1 meals to Supabase
 * Run: node scripts/log-meals-weekend-june1.mjs
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

const EGGS_BREAKFAST = {
  meal_type: "breakfast",
  name: "3 whole eggs + 2 egg whites",
  calories: 250,
  protein: 26,
  fat: 15,
  carbs: 2,
};

const DAYS = {
  "2026-05-30": {
    label: "Saturday May 30",
    meals: [
      EGGS_BREAKFAST,
      {
        meal_type: "lunch",
        name: "Thai yellow curry + rice",
        calories: 750,
        protein: 35,
        fat: 22,
        carbs: 90,
        notes: "Estimated from photo",
      },
      {
        meal_type: "dinner",
        name: "Factor — Country Herb Chicken & Potato Leek Mash",
        calories: 500,
        protein: 40,
        fat: 20,
        carbs: 36,
        notes: "Label: 500 kcal, 40g P, 36g C, 20g F",
      },
      {
        meal_type: "dinner",
        name: "Factor — Pepper Jack Guacamole Burger",
        calories: 650,
        protein: 34,
        fat: 39,
        carbs: 37,
        notes: "Label: 650 kcal, 34g P, 37g C, 39g F",
      },
    ],
  },
  "2026-05-31": {
    label: "Sunday May 31",
    meals: [
      EGGS_BREAKFAST,
      {
        meal_type: "lunch",
        name: "Salmon + black rice + green beans",
        calories: 550,
        protein: 40,
        fat: 18,
        carbs: 45,
        notes: "Estimated portion",
      },
      {
        meal_type: "dinner",
        name: "Factor — Charred Corn & Shredded Chicken Cavatappi",
        calories: 650,
        protein: 33,
        fat: 28,
        carbs: 57,
        notes: "Label: 650 kcal, 33g P, 57g C, ~28g F",
      },
    ],
  },
  "2026-06-01": {
    label: "Monday June 1",
    meals: [
      {
        meal_type: "lunch",
        name: "Factor — Country Herb Chicken & Potato Leek Mash",
        calories: 500,
        protein: 40,
        fat: 20,
        carbs: 36,
        notes: "Label: 500 kcal, 40g P, 36g C, 20g F",
      },
      {
        meal_type: "dinner",
        name: "Factor — Pepper Jack Guacamole Burger",
        calories: 650,
        protein: 34,
        fat: 39,
        carbs: 37,
        notes: "Label: 650 kcal, 34g P, 37g C, 39g F",
      },
      {
        meal_type: "snack",
        name: "Pizza — 2 pepperoni slices + 2 margherita slices",
        calories: 1120,
        protein: 46,
        fat: 44,
        carbs: 128,
        notes: "Est. large slices: pepperoni ~620 cal / margherita ~500 cal",
      },
      {
        meal_type: "snack",
        name: "Quest protein bar",
        calories: 190,
        protein: 21,
        fat: 8,
        carbs: 4,
        notes: "21g protein · ~11:55 PM PT June 1",
      },
      {
        meal_type: "snack",
        name: "Protein shake — 3 scoops ON Gold Standard Whey + 500 mL Kirkland ultra-filtered 2% milk",
        calories: 620,
        protein: 99,
        fat: 13,
        carbs: 22,
        notes: "Whey 360/72g P · Kirkland 500mL ~260/27g P (50% more protein) · ~11:55 PM PT June 1",
      },
    ],
  },
};

async function logDay(date, { label, meals }) {
  console.log(`\n${label} (${date})`);
  console.log("─".repeat(40));

  const { data: existing } = await supabase
    .from("food_entries")
    .select("id, name, meal_type")
    .eq("date", date);

  const manual = (existing ?? []).filter(
    (e) => !String(e.notes ?? "").startsWith("__supplement_macro__")
  );

  if (manual.length) {
    console.log("  Replacing existing entries:");
    for (const e of manual) {
      console.log(`    - [${e.meal_type}] ${e.name}`);
      await supabase.from("food_entries").delete().eq("id", e.id);
    }
  }

  const now = new Date().toISOString();
  const totals = { calories: 0, protein: 0, fat: 0, carbs: 0 };

  for (const item of meals) {
    const { notes, meal_type, ...macros } = item;
    const row = {
      id: uuidv4(),
      date,
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

  console.log(
    `  Day total: ${totals.calories} kcal · ${totals.protein}g P · ${totals.fat}g F · ${totals.carbs}g C`
  );
  return totals;
}

async function main() {
  console.log("Logging weekend + June 1 meals...\n");

  const grand = { calories: 0, protein: 0, fat: 0, carbs: 0 };

  for (const [date, config] of Object.entries(DAYS)) {
    const t = await logDay(date, config);
    grand.calories += t.calories;
    grand.protein += t.protein;
    grand.fat += t.fat;
    grand.carbs += t.carbs;
  }

  console.log("\n" + "═".repeat(40));
  console.log("Weekend + June 1 combined:");
  console.log(
    `  ${grand.calories} kcal · ${grand.protein}g P · ${grand.fat}g F · ${grand.carbs}g C`
  );
  console.log(
    `  Avg/day: ${Math.round(grand.calories / 3)} kcal · ${Math.round(grand.protein / 3)}g P · ${Math.round(grand.fat / 3)}g F · ${Math.round(grand.carbs / 3)}g C`
  );
  console.log("\n✅ Done!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
