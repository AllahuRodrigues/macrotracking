/**
 * Update the user profile (height, ethnicity, goal, macro targets) and log the
 * July 12 self-reported weigh-in (188 lb, ~30% BF).
 * Run: node scripts/sync-profile-july12.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

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

const DATE = "2026-07-12";

const PROFILE = {
  id: "me",
  name: "Rodrigues",
  age: 23,
  height: "5'6\" (5'7\" with shoes)",
  ethnicity: "Black",
  goal:
    "Cut to ~174 lb @ 14–16% BF by Aug 1 — currently 188 lb, ~30% BF. Keep the 86.9 lb muscle, drop trunk fat.",
  target_calories: 2200,
  target_protein: 200,
  target_fat: 55,
  target_carbs: 220,
  notes:
    "5'6\" (5'7\" w/ shoes), Black, 23. 188 lb, ~30% BF (self-reported). InBody SMM 86.9 lb, score 90. Training day 2200 kcal / rest 1950. 200g protein daily, 4L water.",
  updated_at: new Date().toISOString(),
};

const WEIGH_IN = {
  date: DATE,
  weight_lbs: 188,
  body_fat_pct: 30,
  muscle_mass_lbs: 86.9,
  notes:
    "Self-reported 2026-07-12 — 188 lb, ~30% BF (scale/visual). Height 5'6\" (5'7\" w/ shoes), Black. Building muscle while cutting to 174 lb by Aug 1.",
};

async function run() {
  console.log("── Updating profile + July 12 weigh-in ─────────────────────");

  // 1. Upsert user_profile (single row id='me')
  const { error: pErr } = await sb.from("user_profile").upsert(PROFILE, { onConflict: "id" });
  if (pErr) throw pErr;
  console.log("✓ user_profile updated (id 'me')");

  // 2. Upsert today's body metric
  const { data: existing } = await sb
    .from("body_metrics")
    .select("id")
    .eq("date", DATE)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await sb.from("body_metrics").update(WEIGH_IN).eq("id", existing.id);
    if (error) throw error;
    console.log(`✓ Updated body_metrics for ${DATE}`);
  } else {
    const { error } = await sb
      .from("body_metrics")
      .insert({ ...WEIGH_IN, id: uuidv4(), created_at: new Date().toISOString() });
    if (error) throw error;
    console.log(`✓ Inserted body_metrics for ${DATE}`);
  }

  console.log("\n── Summary ─────────────────────────────────────────────────");
  console.log("  Height:    5'6\" (5'7\" with shoes)");
  console.log("  Ethnicity: Black");
  console.log("  Weight:    188 lb");
  console.log("  Body Fat:  ~30% (self-reported)");
  console.log("  Muscle:    86.9 lb SMM");
  console.log("  Target:    174 lb @ 14–16% BF by Aug 1, 2026");
  console.log("────────────────────────────────────────────────────────────\n");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
