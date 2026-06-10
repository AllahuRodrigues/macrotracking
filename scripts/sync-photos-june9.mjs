/**
 * Upload June 9, 2026 body progress photos
 * Run: node scripts/sync-photos-june9.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const DATE = "2026-06-09";

const ASSETS_DIRS = [
  path.join(
    process.env.HOME ?? "",
    ".cursor/projects/Users-allahurodrigues-Desktop-Desktop-My-Desk-PROJECT-macro-tracking/assets"
  ),
  path.join(root, "assets/photos"),
];

function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    const p = path.join(root, name);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i === -1) continue;
      const k = t.slice(0, i);
      const v = t.slice(i + 1).replace(/^"(.*)"$/, "$1");
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

loadEnv();

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
if (!url || !key) { console.error("Missing Supabase keys"); process.exit(1); }

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUCKET = "uploads";

const PHOTOS = [
  {
    asset: "IMG_8237-db19b29c-dfab-4756-bff1-57743b22f551.png",
    storagePath: "photos/progress-2026-06-09-front.png",
    caption: "Front — relaxed",
    pose: "front",
  },
  {
    asset: "IMG_8241-e341a1b1-ca8d-420d-90df-ab35cc71d5bb.png",
    storagePath: "photos/progress-2026-06-09-front-flex.png",
    caption: "Front — double bicep flex",
    pose: "front",
  },
  {
    asset: "IMG_8252-5f8d0e3a-7dc7-4737-b12c-6e16c50f330f.png",
    storagePath: "photos/progress-2026-06-09-back-flex.png",
    caption: "Back — double bicep",
    pose: "back",
  },
  {
    asset: "IMG_8262-bdf17a62-8c0d-48bf-b663-9ccdd82da691.png",
    storagePath: "photos/progress-2026-06-09-abs.png",
    caption: "Front — abs check",
    pose: "front",
  },
  {
    asset: "IMG_8244-d7d2cf26-4e66-4a25-844c-c3c238165b8b.png",
    storagePath: "photos/progress-2026-06-09-side.png",
    caption: "Side profile",
    pose: "side",
  },
];

function findAsset(name) {
  for (const dir of ASSETS_DIRS) {
    const p = path.join(dir, name);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function uploadFile(storagePath, filePath) {
  const buffer = fs.readFileSync(filePath);
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: "image/png",
    upsert: true,
  });
  if (error) throw error;
}

async function upsertPhoto(p) {
  const { data: existing } = await supabase
    .from("photos")
    .select("id")
    .eq("filename", p.storagePath)
    .maybeSingle();

  const row = {
    date: DATE,
    category: "body",
    filename: p.storagePath,
    caption: p.caption,
  };

  if (existing) {
    await supabase.from("photos").update(row).eq("id", existing.id);
    console.log(`  ✓ updated: ${p.caption}`);
  } else {
    await supabase.from("photos").insert({
      id: uuidv4(),
      ...row,
      created_at: new Date().toISOString(),
    });
    console.log(`  ✓ created: ${p.caption}`);
  }
}

async function main() {
  console.log(`Syncing June 9 body progress photos (187.6 lb / InBody 90)...\n`);

  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some((b) => b.name === BUCKET)) {
    await supabase.storage.createBucket(BUCKET, { public: true });
  }

  for (const p of PHOTOS) {
    const filePath = findAsset(p.asset);
    if (!filePath) {
      console.warn(`  ⚠ missing asset: ${p.asset}`);
      continue;
    }
    process.stdout.write(`  uploading ${p.caption}...`);
    await uploadFile(p.storagePath, filePath);
    await upsertPhoto(p);
  }

  const publicBase = `${url}/storage/v1/object/public/${BUCKET}`;
  console.log(`\n✅ Done!`);
  console.log(`   Sample: ${publicBase}/photos/progress-2026-06-09-front.png`);
}

main().catch((e) => { console.error(e); process.exit(1); });
