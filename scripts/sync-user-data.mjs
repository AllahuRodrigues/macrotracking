/**
 * Update profile, body stats, and supplements in Supabase.
 * Run: npm run sync-user-data
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

const TODAY = "2026-05-28";

const SUPPLEMENT_UPDATES = [
  {
    match: "Quest",
    patch: {
      name: "Quest Protein Bar — Cookies & Cream",
      brand: "Quest",
      dose: "1 bar",
      category: "protein",
      timing: "Snack — anytime",
      frequency: "daily",
      notes: "21g protein · 4g carbs per bar — adds to daily macros when checked",
      tracks_macros: 1,
      macro_calories: 190,
      macro_protein: 21,
      macro_fat: 8,
      macro_carbs: 4,
      allows_quantity: 0,
      active: 1,
    },
  },
  {
    match: "Whey",
    patch: {
      name: "Gold Standard 100% Whey",
      brand: "Optimum Nutrition",
      dose: "1 scoop (~24g protein)",
      category: "protein",
      timing: "Post-workout or shake",
      frequency: "daily",
      notes: "Vanilla Ice Cream — adjust scoops when logging shake",
      tracks_macros: 1,
      macro_calories: 120,
      macro_protein: 24,
      macro_fat: 1,
      macro_carbs: 3,
      allows_quantity: 1,
      active: 1,
    },
  },
  {
    match: "Zinc",
    patch: {
      frequency: "every_2_days",
      timing: "Every 2 days with breakfast",
      notes: "50 mg — every 2 days only (not daily)",
      active: 1,
    },
  },
];

const NEW_SUPPLEMENTS = [
  {
    name: "Minoxidil",
    brand: "Rogaine / generic",
    dose: "Topical — face",
    category: "other",
    timing: "Daily — apply to face",
    frequency: "daily",
    notes: "Daily minoxidil application on face",
    active: 1,
  },
  {
    name: "Clomid",
    brand: "",
    dose: "As prescribed",
    category: "other",
    timing: "Every 2 days",
    frequency: "every_2_days",
    notes: "Clomid every 2 days",
    active: 1,
  },
];

async function ensureColumns() {
  // Best-effort — run manually in SQL editor if this fails
  const alters = [
    "ALTER TABLE supplements ADD COLUMN IF NOT EXISTS tracks_macros INTEGER DEFAULT 0",
    "ALTER TABLE supplements ADD COLUMN IF NOT EXISTS macro_calories REAL DEFAULT 0",
    "ALTER TABLE supplements ADD COLUMN IF NOT EXISTS macro_protein REAL DEFAULT 0",
    "ALTER TABLE supplements ADD COLUMN IF NOT EXISTS macro_fat REAL DEFAULT 0",
    "ALTER TABLE supplements ADD COLUMN IF NOT EXISTS macro_carbs REAL DEFAULT 0",
    "ALTER TABLE supplements ADD COLUMN IF NOT EXISTS allows_quantity INTEGER DEFAULT 0",
    "ALTER TABLE supplement_intakes ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1",
    "ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS ethnicity TEXT",
  ];
  for (const sql of alters) {
    const { error } = await supabase.rpc("exec_sql", { query: sql }).maybeSingle();
    if (error) {
      // rpc may not exist — columns might already be there from manual migration
    }
  }
}

async function main() {
  console.log("Syncing user data to Supabase...\n");
  await ensureColumns();

  // Profile (without ethnicity if column missing)
  const profilePayload = {
    id: "me",
    name: "Rodrigues",
    age: 23,
    height: "5′6.5″",
    goal: "Cut — 187 lb → 174–176 lb @ 14–16% BF (8–10 weeks · 1.5 lb/week)",
    target_calories: 2250,
    target_protein: 200,
    target_fat: 61,
    target_carbs: 200,
    notes:
      "Black male, age 23, 5′6.5″. InBody Score 88. Upper body dominant. Main target: trunk fat. Current: 189.6 lb / 25% BF. Fitness SF trainer. PPL Mon–Sat + 1hr treadmill daily.",
    updated_at: new Date().toISOString(),
  };

  const { error: profileErr } = await supabase.from("user_profile").upsert(profilePayload, { onConflict: "id" });
  if (profileErr) console.warn("  profile:", profileErr.message);
  else console.log("  ✓ profile updated");

  // Body metric for today
  const { data: existingBody } = await supabase
    .from("body_metrics")
    .select("id")
    .eq("date", TODAY)
    .maybeSingle();

  const bodyRow = {
    date: TODAY,
    weight_lbs: 189.6,
    body_fat_pct: 25,
    notes: "Weigh-in — 189.6 lb @ 25% BF",
  };

  if (existingBody) {
    await supabase.from("body_metrics").update(bodyRow).eq("id", existingBody.id);
  } else {
    await supabase.from("body_metrics").insert({
      id: uuidv4(),
      ...bodyRow,
      created_at: new Date().toISOString(),
    });
  }
  console.log("  ✓ body metric: 189.6 lb / 25% BF");

  // Supplements
  const { data: allSupps } = await supabase.from("supplements").select("*");
  for (const upd of SUPPLEMENT_UPDATES) {
    const match = allSupps?.find((s) => s.name.includes(upd.match));
    if (match) {
      let { error } = await supabase.from("supplements").update(upd.patch).eq("id", match.id);
      if (error?.message?.includes("tracks_macros") || error?.message?.includes("allows_quantity")) {
        const { tracks_macros, macro_calories, macro_protein, macro_fat, macro_carbs, allows_quantity, ...basic } = upd.patch;
        ({ error } = await supabase.from("supplements").update(basic).eq("id", match.id));
      }
      if (error) console.warn(`  ${upd.match}:`, error.message);
      else console.log(`  ✓ updated: ${upd.match}`);
    } else {
      console.warn(`  ⚠ not found: ${upd.match}`);
    }
  }

  for (const s of NEW_SUPPLEMENTS) {
    const exists = allSupps?.find((x) => x.name === s.name);
    if (exists) {
      await supabase.from("supplements").update({ ...s, active: 1 }).eq("id", exists.id);
      console.log(`  ✓ updated: ${s.name}`);
    } else {
      await supabase.from("supplements").insert({
        id: uuidv4(),
        ...s,
        created_at: new Date().toISOString(),
      });
      console.log(`  ✓ added: ${s.name}`);
    }
  }

  console.log("\n✅ Done!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
