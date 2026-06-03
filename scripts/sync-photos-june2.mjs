/**
 * Upload June 2, 2026 body progress photos + weight reading
 * Run: node scripts/sync-photos-june2.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const DATE = "2026-06-02";
const WEIGHT_LBS = 189;

const ASSETS_DIRS = [
  path.join(
    process.env.HOME ?? "",
    ".cursor/projects/Users-allahurodrigues-Desktop-Desktop-My-Desk-PROJECT-macro-tracking/assets"
  ),
  path.join(root, "assets/photos"),
];

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

const BUCKET = "uploads";

const PHOTOS = [
  {
    asset: "IMG_8031-cd732410-b061-423a-ac25-88bbeca438a4.png",
    storagePath: "photos/progress-2026-06-02-back-flex.png",
    caption: "Back — double bicep",
    pose: "back",
  },
  {
    asset: "IMG_8035-777e000b-9654-4f21-a6d7-77d8de79c3f1.png",
    storagePath: "photos/progress-2026-06-02-front-quads.png",
    caption: "Front — quads flex",
    pose: "front",
  },
  {
    asset: "IMG_8026-793c1750-65ee-4e2a-b718-a9522e842cc5.png",
    storagePath: "photos/progress-2026-06-02-front.png",
    caption: "Front — relaxed",
    pose: "front",
  },
  {
    asset: "IMG_8028-6fc3b392-b575-4de8-ae36-e7beed52f21d.png",
    storagePath: "photos/progress-2026-06-02-side.png",
    caption: "Side profile",
    pose: "side",
  },
  {
    asset: "IMG_8025-4a886e57-d899-489c-a26f-0af6692f484c.png",
    storagePath: "photos/progress-2026-06-02-front-casual.png",
    caption: "Front — casual",
    pose: "front",
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

async function upsertWeight() {
  const { data: existing } = await supabase
    .from("body_metrics")
    .select("id")
    .eq("date", DATE)
    .maybeSingle();

  const row = {
    date: DATE,
    weight_lbs: WEIGHT_LBS,
    notes: `Progress check-in — ${WEIGHT_LBS} lb (~85 kg). Photo set: 5 poses.`,
  };

  if (existing) {
    await supabase.from("body_metrics").update(row).eq("id", existing.id);
    console.log(`  ✓ body_metrics updated: ${WEIGHT_LBS} lb`);
  } else {
    await supabase.from("body_metrics").insert({
      id: uuidv4(),
      ...row,
      created_at: new Date().toISOString(),
    });
    console.log(`  ✓ body_metrics created: ${WEIGHT_LBS} lb`);
  }

  await supabase.from("user_profile").upsert(
    {
      id: "me",
      weight_lbs: WEIGHT_LBS,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
  console.log("  ✓ profile weight updated");
}

async function main() {
  console.log(`Syncing June 2 body photos + ${WEIGHT_LBS} lb...\n`);

  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some((b) => b.name === BUCKET)) {
    await supabase.storage.createBucket(BUCKET, { public: true });
  }

  for (const p of PHOTOS) {
    const filePath = findAsset(p.asset);
    if (!filePath) {
      console.warn(`  ⚠ missing: ${p.asset}`);
      continue;
    }
    await uploadFile(p.storagePath, filePath);
    await upsertPhoto(p);
  }

  await upsertWeight();

  const publicBase = `${url}/storage/v1/object/public/${BUCKET}`;
  console.log(`\n✅ Done! Sample: ${publicBase}/photos/progress-2026-06-02-front.png`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
