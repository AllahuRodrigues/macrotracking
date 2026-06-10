/**
 * Sync June 9 InBody 580 scan to body_metrics + update user profile
 * Run: node scripts/sync-inbody-june9.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

// Load .env.local or .env
for (const name of [".env.local", ".env"]) {
  const envPath = path.join(root, name);
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^([^#=\s]+)\s*=\s*"?([^"\n]*)"?\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  }
}

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");

const sb = createClient(url, key);

const SCAN_DATE = "2026-06-09";

// ── InBody 580 — June 9, 2026 19:50 ──────────────────────────────────────────
const BODY_METRIC = {
  date: SCAN_DATE,
  weight_lbs: 187.6,
  body_fat_pct: 19.9,
  muscle_mass_lbs: 86.9,       // skeletal muscle mass
  skeletal_muscle_lbs: 86.9,
  bmi: 29.8,
  visceral_fat: 68.2,           // cm²
  inbody_score: 90,
  body_water_pct: 73.2,         // TBW/FFM %
  bmr: 1843,                    // kcal (7711 kJ)
  notes: [
    "InBody 580 — 2026-06-09 19:50. Score 90 (+5).",
    "Weight 187.6 lb. SMM 86.9 lb (+1.8 vs May 22). BF 37.3 lb (-1.7). PBF 19.9% (-1.0%).",
    "Visceral fat 68.2 cm² (-8.1), level 6 (-1). Phase angle 7.5°. FFMI 23.9.",
    "Segmental lean — Trunk 65.4 lb, L-Arm 8.82, R-Arm 8.62, L-Leg 20.86, R-Leg 20.68.",
    "EGYM strength: Chest 207 lb, Shoulder 227 lb, Lat PD 324 lb, Seated Row 309 lb, Leg Ext 271 lb, Leg Press 377 lb, Leg Curl 187 lb.",
    "EGYM ranking: 32nd / 1 066 pts / top 10%. BioAge 27 (real 23). Upper 21 yr, Lower 34 yr.",
    "Target: -10.8 lb fat → ~174 lb @ 14-16% BF by Aug 1, 2026.",
  ].join(" "),
};

// ── User profile goals for the cut ───────────────────────────────────────────
const PROFILE_GOALS = {
  goal: "cut",
  target_weight_lbs: 174,
  target_body_fat_pct: 15,
  target_date: "2026-08-01",
  workout_calories: 2200,
  rest_calories: 1900,
  protein_g: 190,
  carbs_workout_g: 200,
  carbs_rest_g: 130,
  fat_g: 60,
  notes: "InBody 580 Jun 9 — 187.6 lb, 19.9% BF, SMM 86.9 lb. Cut target 174 lb by Aug 1. 50-min walk active days.",
};

async function run() {
  console.log("── Syncing InBody June 9 scan ──────────────────────────────");

  // 1. Upsert body_metric
  const { data: existing } = await sb
    .from("body_metrics")
    .select("id")
    .eq("date", SCAN_DATE)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await sb
      .from("body_metrics")
      .update(BODY_METRIC)
      .eq("id", existing.id);
    if (error) throw error;
    console.log(`✓ Updated body_metrics for ${SCAN_DATE} (id ${existing.id})`);
  } else {
    const { error } = await sb
      .from("body_metrics")
      .insert({ ...BODY_METRIC, id: uuidv4(), created_at: new Date().toISOString() });
    if (error) throw error;
    console.log(`✓ Inserted body_metrics for ${SCAN_DATE}`);
  }

  // 2. Update profile (upsert row id=1 or the first user row)
  const { data: profile } = await sb
    .from("profiles")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (profile?.id) {
    const { error } = await sb
      .from("profiles")
      .update(PROFILE_GOALS)
      .eq("id", profile.id);
    if (error) {
      console.warn("Profile update skipped (column mismatch?):", error.message);
    } else {
      console.log(`✓ Profile updated (id ${profile.id})`);
    }
  } else {
    console.log("No profile row found — skipping profile update.");
  }

  // 3. Summary
  console.log("\n── Summary ─────────────────────────────────────────────────");
  console.log(`  Weight:         187.6 lb`);
  console.log(`  Body Fat:       37.3 lb  (19.9%)`);
  console.log(`  Muscle (SMM):   86.9 lb`);
  console.log(`  Visceral Fat:   68.2 cm²  Lv 6`);
  console.log(`  InBody Score:   90`);
  console.log(`  BMR:            1,843 kcal`);
  console.log(`  Phase Angle:    7.5°`);
  console.log(`  FFMI:           23.9`);
  console.log(`  Target:         174 lb @ 14–16% BF by Aug 1, 2026`);
  console.log("────────────────────────────────────────────────────────────\n");
}

run().catch((e) => { console.error(e); process.exit(1); });
