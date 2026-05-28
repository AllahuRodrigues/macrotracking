/**
 * One-time Supabase setup: apply schema + create storage bucket + upload local images.
 * Run: node scripts/setup-supabase.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

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
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function applySchema() {
  if (!databaseUrl) {
    console.log("Skip schema: no DATABASE_URL — run supabase/schema.sql in Supabase SQL Editor");
    return;
  }
  try {
    const schema = fs.readFileSync(path.join(root, "supabase/schema.sql"), "utf8");
    const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
    await client.connect();
    await client.query(schema);
    await client.end();
    console.log("✓ Schema applied via DATABASE_URL");
  } catch (e) {
    console.warn("⚠ Schema via DATABASE_URL failed — run supabase/schema.sql manually in SQL Editor");
    console.warn(String(e));
  }
}

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.some((b) => b.name === "uploads")) {
    console.log("✓ Storage bucket 'uploads' exists");
    return;
  }
  const { error } = await supabase.storage.createBucket("uploads", { public: true });
  if (error && !error.message.includes("already exists")) throw error;
  console.log("✓ Storage bucket 'uploads' created");
}

async function uploadLocalImages() {
  const uploadsDir = path.join(root, "public/uploads");
  if (!fs.existsSync(uploadsDir)) return;

  const files = fs.readdirSync(uploadsDir).filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f));
  for (const file of files) {
    const buffer = fs.readFileSync(path.join(uploadsDir, file));
    const folder = file.startsWith("profile") ? "avatars" : "photos";
    const storagePath = `${folder}/${file}`;
    const { error } = await supabase.storage.from("uploads").upload(storagePath, buffer, {
      contentType: "image/png",
      upsert: true,
    });
    if (error) {
      console.warn(`  ⚠ ${file}: ${error.message}`);
    } else {
      console.log(`  ✓ uploaded ${storagePath}`);
      fs.unlinkSync(path.join(uploadsDir, file));
    }
  }
}

async function main() {
  console.log("Setting up Supabase...\n");
  await applySchema();
  await ensureBucket();
  console.log("\nUploading local images to Supabase Storage...");
  await uploadLocalImages();
  console.log("\nDone. Add the same env vars to Vercel and redeploy.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
