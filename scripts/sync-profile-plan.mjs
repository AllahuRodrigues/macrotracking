/**
 * Update the profile notes to reflect the 21-day plan: 3–4 h training/day and
 * 2 × 30 min sauna per week. Run: node scripts/sync-profile-plan.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
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

const PROFILE = {
  id: "me",
  name: "Rodrigues",
  age: 23,
  height: "5'6\" (5'7\" with shoes)",
  ethnicity: "Black",
  goal:
    "Definition block Jul 13–31 + Aug 3–14 → ~174 lb @ 14–16% BF. Push/Pull/Legs. Keep 86.9 lb muscle, drop trunk fat. Reset Aug 1–2.",
  target_calories: 2200,
  target_protein: 200,
  target_fat: 55,
  target_carbs: 220,
  notes:
    "5'6\" (5'7\" w/ shoes), Black, 23. ~188 lb, ~30% BF (self-reported). InBody SMM 86.9 lb, score 90. Push (chest/shoulders/tris) · Pull (back/bis/forearms/core) · Legs (+ core). Training 2200 kcal / rest 1950. 200g protein, 4L water, 12–15k steps. 3–4 h training/day. 2 × 30 min sauna/week (Wed & Sun). Creatine 5g. Asthma: progressive warm-up before sprints.",
  updated_at: new Date().toISOString(),
};

async function run() {
  const { error } = await sb.from("user_profile").upsert(PROFILE, { onConflict: "id" });
  if (error) throw error;
  console.log("✓ Profile updated for Jul 13–31 / Aug 3–14 PPL cut.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
