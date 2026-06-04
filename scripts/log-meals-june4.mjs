/**
 * Log June 4, 2026 meals to Supabase
 * Run: node scripts/log-meals-june4.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const DATE = "2026-06-04";

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
    name: "Protein shake — 4 scoops ON whey + 80 mL whole milk + 10g creatine (400 mL shaker)",
    calories: 530,
    protein: 99,
    fat: 7,
    carbs: 16,
    notes: "Whey 480/96g P · whole milk 80mL ~50/3g P · creatine 10g · rest water to 400mL",
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
