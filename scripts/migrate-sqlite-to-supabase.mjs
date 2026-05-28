/**
 * One-time: copy ALL data from local data/macro-tracking.db → Supabase.
 * Prerequisites:
 *   1. .env has Supabase keys
 *   2. supabase/schema.sql already run in SQL Editor
 *
 * Run: npm run migrate-to-supabase
 * Then safe to delete: rm -rf data/
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const DB_PATH = path.join(root, "data/macro-tracking.db");

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

if (!fs.existsSync(DB_PATH)) {
  console.error("No local database at data/macro-tracking.db — nothing to migrate.");
  process.exit(0);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const sqlite = new Database(DB_PATH, { readonly: true });

/** Map old local filenames → Supabase Storage paths */
function mapPhotoFilename(filename) {
  if (filename.startsWith("avatars/") || filename.startsWith("photos/")) return filename;
  if (filename.startsWith("profile")) return `avatars/${filename}`;
  return `photos/${filename}`;
}

async function upsertTable(table, rows, transform) {
  if (!rows.length) {
    console.log(`  ${table}: (empty, skip)`);
    return;
  }
  const data = transform ? rows.map(transform) : rows;
  const { error } = await supabase.from(table).upsert(data, { onConflict: "id" });
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`  ✓ ${table}: ${rows.length} rows`);
}

async function main() {
  console.log("Migrating local SQLite → Supabase...\n");

  // Order matters for FK-ish relationships (templates before exercises)
  const order = [
    "user_profile",
    "supplements",
    "food_entries",
    "body_metrics",
    "photos",
    "supplement_intakes",
    "workout_templates",
    "template_exercises",
    "workout_sessions",
    "session_exercises",
    "water_logs",
  ];

  for (const table of order) {
    const rows = sqlite.prepare(`SELECT * FROM ${table}`).all();
    if (table === "photos") {
      await upsertTable(table, rows, (r) => ({
        ...r,
        filename: mapPhotoFilename(r.filename),
      }));
    } else if (table === "user_profile" && rows[0]) {
      await upsertTable(table, rows, (r) => ({
        ...r,
        avatar_filename: r.avatar_filename
          ? mapPhotoFilename(r.avatar_filename)
          : r.avatar_filename,
      }));
    } else if (table === "supplements") {
      await upsertTable(table, rows, (r) => ({
        ...r,
        frequency: r.frequency ?? "daily",
      }));
    } else {
      await upsertTable(table, rows);
    }
  }

  sqlite.close();
  console.log("\n✅ Migration complete!");
  console.log("\nNext steps:");
  console.log("  1. Restart: npm run dev");
  console.log("  2. Verify data loads at http://localhost:3000");
  console.log("  3. Delete local DB: rm -rf data/");
  console.log("  4. Add same .env vars to Vercel → redeploy");
}

main().catch((e) => {
  console.error("\n❌ Migration failed:", e.message);
  console.error("\nIf tables don't exist, run supabase/schema.sql in Supabase SQL Editor first.");
  process.exit(1);
});
