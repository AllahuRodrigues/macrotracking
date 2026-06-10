/**
 * Log June 5, 2026 meals to Supabase
 * Run: node scripts/log-meals-june5.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const DATE = "2026-06-05";

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
    meal_type: "lunch",
    name: "Fanoos — Chicken Shawarma Wrap ×2 (small)",
    calories: 620,
    protein: 38,
    fat: 24,
    carbs: 58,
    notes: "1 order = 2 hand-size lavash wraps · chicken, veggies, tahini, sumac onion",
  },
  {
    meal_type: "lunch",
    name: "Garlic white sauce (toum)",
    calories: 80,
    protein: 0,
    fat: 9,
    carbs: 2,
    notes: "Side white garlic sauce with shawarma",
  },
  {
    meal_type: "lunch",
    name: "Hummus (4 tsp from large container)",
    calories: 55,
    protein: 2,
    fat: 3,
    carbs: 5,
    notes: "Big container — only ~4 teaspoon scoops eaten",
  },
  {
    meal_type: "snack",
    name: "Tequila (2 shots)",
    calories: 194,
    protein: 0,
    fat: 0,
    carbs: 0,
    notes: "~1.5 oz each · ~97 kcal/shot",
  },
  {
    meal_type: "snack",
    name: "Gin (3 shots)",
    calories: 291,
    protein: 0,
    fat: 0,
    carbs: 0,
    notes: "~1.5 oz each · ~97 kcal/shot",
  },
  {
    meal_type: "dinner",
    name: "Unknown meal (forgot item)",
    calories: 600,
    protein: 35,
    fat: 0,
    carbs: 0,
    notes: "User estimate — 600 kcal, 35g protein; item not remembered",
  },
];

async function main() {
  console.log(`Logging meals for ${DATE}...\n`);

  const { data: existing } = await supabase
    .from("food_entries")
    .select("id, name, meal_type")
    .eq("date", DATE);

  const manual = (existing ?? []).filter(
    (e) => !String(e.notes ?? "").startsWith("__supplement_macro__")
  );

  if (manual.length) {
    console.log("  Replacing existing manual entries:");
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

  console.log(
    `\n  Day total: ${totals.calories} kcal · ${totals.protein}g P · ${totals.fat}g F · ${totals.carbs}g C`
  );
  console.log("\n✅ Done!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
