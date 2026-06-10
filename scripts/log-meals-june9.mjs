/**
 * Log June 9, 2026 meals to Supabase
 * Run: node scripts/log-meals-june9.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const DATE = "2026-06-09";

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
    name: "Factor — Tangy Southern Chicken (red potatoes & creamed corn)",
    calories: 680,
    protein: 40,
    fat: 32,
    carbs: 40,
    notes: "Full tray 12.2 oz / 346g — label: 680 kcal, 40g P, 40g C; fat est.",
  },
  {
    meal_type: "dinner",
    name: "Factor — Caramelized Onion Gournay Burger (spinach & paprika roasted potatoes) ×2",
    calories: 1180,
    protein: 62,
    fat: 68,
    carbs: 74,
    notes: "2 full trays 11.3 oz / 320g each — label: 590 kcal, 31g P, 37g C, 34g F per tray",
  },
  {
    meal_type: "snack",
    name: "Quest bar — Cookies & Cream (afternoon)",
    calories: 190,
    protein: 21,
    fat: 8,
    carbs: 4,
    notes: "Label: 190 kcal, 21g P, 4g net carbs",
  },
  {
    meal_type: "snack",
    name: "Quest bar — Cookies & Cream (dinner snack)",
    calories: 190,
    protein: 21,
    fat: 8,
    carbs: 4,
    notes: "Label: 190 kcal, 21g P, 4g net carbs",
  },
  {
    meal_type: "snack",
    name: "Protein shake — 2 scoops ON whey + 10g creatine (400 mL shaker, water)",
    calories: 240,
    protein: 48,
    fat: 2,
    carbs: 6,
    notes: "Whey 240/48g P · creatine 10g · shaker filled to 400mL with water",
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
