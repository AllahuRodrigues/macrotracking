/**
 * Apply daily_checkins table. Run: node scripts/apply-daily-checkins.mjs
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
if (!url || !key) throw new Error("Missing Supabase keys");

const sb = createClient(url, key);

// Use REST-friendly approach: insert a dummy then delete won't create table.
// Prefer SQL via rpc if available; otherwise document for SQL editor.
const sql = `
CREATE TABLE IF NOT EXISTS daily_checkins (
  date TEXT PRIMARY KEY,
  sleep_hours DOUBLE PRECISION,
  sleep_quality INTEGER,
  steps INTEGER,
  resting_hr INTEGER,
  hrv INTEGER,
  hunger INTEGER,
  stress INTEGER,
  bloating INTEGER,
  soreness INTEGER,
  motivation INTEGER,
  session_rpe INTEGER,
  caffeine_mg INTEGER,
  alcohol INTEGER DEFAULT 0,
  notes TEXT,
  source TEXT DEFAULT 'manual',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

async function main() {
  // Try PostgREST schema via a no-op upsert after ensuring table exists
  // Many projects expose exec_sql; fall back to testing select.
  const { error: selErr } = await sb.from("daily_checkins").select("date").limit(1);
  if (!selErr) {
    console.log("✓ daily_checkins already exists");
    return;
  }
  console.log("Table missing. Attempting create via supabase rpc exec_sql…");
  const { error } = await sb.rpc("exec_sql", { query: sql });
  if (error) {
    console.log(`
Could not auto-create table (${error.message}).
Paste this into the Supabase SQL editor:

${sql}
`);
    process.exit(0);
  }
  console.log("✓ daily_checkins created");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
