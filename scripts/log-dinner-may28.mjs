/**
 * Log May 28 dinner to Supabase
 * Run: node scripts/log-dinner-may28.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const DATE = "2026-05-28";

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

const DINNER = [
  {
    name: "Factor — Creamy Lemon Pepper Chicken (veggie rice pilaf, broccoli & carrots)",
    calories: 550,
    protein: 42,
    fat: 27,
    carbs: 35,
    notes: "Full tray 12.5 oz / 354g — label: 550 kcal, 42g P, 35g C",
  },
  {
    name: "Cuisine Solutions sous vide flame-seared chicken (1 serving)",
    calories: 100,
    protein: 18,
    fat: 2,
    carbs: 0,
    notes: "1 serving @ 18g protein (3 oz) per pack label",
  },
  {
    name: "Olive oil + spices (3 tbsp oil, red spices, salt, steak spice)",
    calories: 360,
    protein: 0,
    fat: 42,
    carbs: 0,
    notes: "3 tbsp olive oil for sauce; spices negligible",
  },
  {
    name: "Smirnoff Ice Mango (1 bottle, 11.2 oz)",
    calories: 228,
    protein: 0,
    fat: 0,
    carbs: 32,
    notes: "228 kcal, 32g carbs per bottle",
  },
];

async function main() {
  console.log(`Logging dinner for ${DATE}...\n`);

  const { data: existing } = await supabase
    .from("food_entries")
    .select("id, name")
    .eq("date", DATE)
    .eq("meal_type", "dinner");

  if (existing?.length) {
    console.log("  Removing old dinner entries:");
    for (const e of existing) {
      console.log(`    - ${e.name}`);
      await supabase.from("food_entries").delete().eq("id", e.id);
    }
  }

  const now = new Date().toISOString();
  let dinnerTotals = { calories: 0, protein: 0, fat: 0, carbs: 0 };

  for (const item of DINNER) {
    const { notes, ...macros } = item;
    const row = {
      id: uuidv4(),
      date: DATE,
      meal_type: "dinner",
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
    dinnerTotals.calories += macros.calories;
    dinnerTotals.protein += macros.protein;
    dinnerTotals.fat += macros.fat;
    dinnerTotals.carbs += macros.carbs;
    console.log(`  ✓ ${item.name}`);
    console.log(`      ${macros.calories} kcal · ${macros.protein}g P · ${macros.fat}g F · ${macros.carbs}g C`);
  }

  console.log("\n  Dinner total:");
  console.log(
    `    ${dinnerTotals.calories} kcal · ${dinnerTotals.protein}g P · ${dinnerTotals.fat}g F · ${dinnerTotals.carbs}g C`
  );

  const { data: allDay } = await supabase
    .from("food_entries")
    .select("calories, protein, fat, carbs")
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

  console.log("\n  May 28 full day (meals + supplements):");
  console.log(
    `    ${Math.round(day.calories)} kcal · ${Math.round(day.protein)}g P · ${Math.round(day.fat)}g F · ${Math.round(day.carbs)}g C`
  );
  console.log("\n✅ Done!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
