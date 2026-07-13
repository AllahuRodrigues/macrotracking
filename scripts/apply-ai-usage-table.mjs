/**
 * Create the ai_usage table used by the AI food-analysis daily spend cap.
 * Run: node scripts/apply-ai-usage-table.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

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

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("Missing DATABASE_URL");

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

const SQL = `
CREATE TABLE IF NOT EXISTS ai_usage (
  date TEXT PRIMARY KEY,
  spent_usd DOUBLE PRECISION NOT NULL DEFAULT 0,
  requests INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`;

await client.connect();
await client.query(SQL);
await client.end();
console.log("✓ ai_usage table ready.");
