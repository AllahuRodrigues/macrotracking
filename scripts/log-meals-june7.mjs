/**
 * Log June 7, 2026 meals to Supabase
 * Run: node scripts/log-meals-june7.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const DATE = "2026-06-07";

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
    name: "Oikos protein yogurt",
    calories: 90,
    protein: 15,
    fat: 0,
    carbs: 7,
  },
  {
    meal_type: "lunch",
    name: "Factor — Roasted Garlic Chicken with Gravy (chive-Yukon mash & green beans)",
    calories: 370,
    protein: 40,
    fat: 11,
    carbs: 26,
    notes: "Full tray 11.6 oz / 329g — label: 370 kcal, 40g P, 26g C, 11g F",
  },
  {
    meal_type: "lunch",
    name: "Factor — Creamy Lemon Pepper Chicken (veggie rice pilaf, broccoli & carrots)",
    calories: 550,
    protein: 42,
    fat: 29,
    carbs: 35,
    notes: "Full tray 12.5 oz / 354g — label: 550 kcal, 42g P, 35g C, 29g F",
  },
  {
    meal_type: "snack",
    name: "Chocolate-drizzled croissants ×2",
    calories: 800,
    protein: 14,
    fat: 44,
    carbs: 90,
    notes: "Large bakery croissants with chocolate drizzle — est. ~400 kcal each",
  },
  {
    meal_type: "dinner",
    name: "Steak with red wine/onion glaze, roasted potatoes & broccoli",
    calories: 730,
    protein: 58,
    fat: 35,
    carbs: 41,
    notes: "Est. ~8 oz steak ~500/50P · potato wedges ~175 · broccoli ~55",
  },
  {
    meal_type: "dinner",
    name: "Red wine (2 glasses)",
    calories: 250,
    protein: 0,
    fat: 0,
    carbs: 8,
    notes: "Casone Toscana · ~5 oz per glass · ~125 kcal/glass",
  },
  {
    meal_type: "snack",
    name: "Chocolate cake (1 slice)",
    calories: 450,
    protein: 5,
    fat: 22,
    carbs: 55,
    notes: "Est. bakery/restaurant slice",
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
