/**
 * Log June 6, 2026 meals to Supabase
 * Run: node scripts/log-meals-june6.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const DATE = "2026-06-06";

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
    name: "Quest protein bar",
    calories: 190,
    protein: 21,
    fat: 8,
    carbs: 4,
    notes: "Label: 190 kcal, 21g P, 4g net carbs",
  },
  {
    meal_type: "lunch",
    name: "Factor — Pesto Chicken & Quinoa (peppers, squash & carrots)",
    calories: 590,
    protein: 43,
    fat: 25,
    carbs: 42,
    notes: "Full tray 14 oz / 397g — label: 590 kcal, 43g P, 42g C, 25g F",
  },
  {
    meal_type: "lunch",
    name: "Factor — Ginger Teriyaki Salmon (forbidden rice & sesame green beans)",
    calories: 610,
    protein: 36,
    fat: 26,
    carbs: 61,
    notes: "Full tray 14.2 oz / 403g — label: 610 kcal, 36g P, 61g C, 26g F",
  },
  {
    meal_type: "dinner",
    name: "In-N-Out Double-Double ×2",
    calories: 1340,
    protein: 74,
    fat: 78,
    carbs: 82,
    notes: "670 kcal each per In-N-Out nutrition · ~9pm",
  },
  {
    meal_type: "dinner",
    name: "In-N-Out french fries (1 order)",
    calories: 395,
    protein: 7,
    fat: 18,
    carbs: 54,
    notes: "Regular fries · ~9pm",
  },
  {
    meal_type: "dinner",
    name: "Coke (1 cup)",
    calories: 150,
    protein: 0,
    fat: 0,
    carbs: 39,
    notes: "~9pm · water also (0 cal, not logged)",
  },
  {
    meal_type: "snack",
    name: "Popcorn (11 pieces)",
    calories: 60,
    protein: 1,
    fat: 3,
    carbs: 6,
    notes: "Exactly 11 pieces — small est. ~5–6 kcal/piece",
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
