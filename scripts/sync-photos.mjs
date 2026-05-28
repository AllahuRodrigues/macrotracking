/**
 * Upload profile + progress photos to Supabase Storage and ensure DB records exist.
 * Run: npm run sync-photos
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const ASSETS_DIRS = [
  path.join(root, "assets/photos"),
  path.join(
    process.env.HOME ?? "",
    ".cursor/projects/Users-allahurodrigues-Desktop-Desktop-My-Desk-PROJECT-macro-tracking/assets"
  ),
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
const DATE = "2026-05-28";

const PHOTOS = [
  {
    asset: "IMG_7327-4ac845be-4e6e-43cc-b869-1470c5d6aed1.png",
    storagePath: "avatars/profile-avatar.png",
    type: "avatar",
  },
  {
    asset: "IMG_7335_2-c7afd0c1-8dc3-474f-8573-e1af320114fe.png",
    storagePath: "photos/progress-2026-05-28-1.png",
    caption: "May 28 — front mirror",
  },
  {
    asset: "IMG_7347-09cc5eb1-67e8-47c3-b688-dd57ebe2b0ff.png",
    storagePath: "photos/progress-2026-05-28-2.png",
    caption: "May 28 — bicep flex",
  },
  {
    asset: "IMG_7328-4e05375b-f2c2-4219-bd3e-4858cc73abca.png",
    storagePath: "photos/progress-2026-05-28-3.png",
    caption: "May 28 — front",
  },
];

async function uploadFile(storagePath, filePath) {
  const buffer = fs.readFileSync(filePath);
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: "image/png",
    upsert: true,
  });
  if (error) throw error;
  console.log(`  ✓ storage: ${storagePath}`);
}

function findAsset(name) {
  for (const dir of ASSETS_DIRS) {
    const p = path.join(dir, name);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function main() {
  console.log("Syncing photos to Supabase...\n");

  // Ensure bucket
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some((b) => b.name === BUCKET)) {
    await supabase.storage.createBucket(BUCKET, { public: true });
    console.log("  ✓ created bucket");
  }

  for (const p of PHOTOS) {
    const filePath = findAsset(p.asset);
    if (!filePath) {
      console.warn(`  ⚠ missing: ${p.asset}`);
      continue;
    }
    await uploadFile(p.storagePath, filePath);

    if (p.type === "avatar") {
      const { error } = await supabase.from("user_profile").upsert(
        { id: "me", avatar_filename: p.storagePath, updated_at: new Date().toISOString() },
        { onConflict: "id" }
      );
      if (error) console.warn("  profile update:", error.message);
      else console.log("  ✓ profile avatar updated");
    } else {
      // Upsert photo record by filename
      const { data: existing } = await supabase
        .from("photos")
        .select("id")
        .eq("filename", p.storagePath)
        .maybeSingle();

      if (existing) {
        await supabase.from("photos").update({ caption: p.caption, date: DATE }).eq("id", existing.id);
        console.log(`  ✓ photo record updated: ${p.caption}`);
      } else {
        await supabase.from("photos").insert({
          id: uuidv4(),
          date: DATE,
          category: "body",
          filename: p.storagePath,
          caption: p.caption,
          created_at: new Date().toISOString(),
        });
        console.log(`  ✓ photo record created: ${p.caption}`);
      }
    }
  }

  const publicBase = `${url}/storage/v1/object/public/${BUCKET}`;
  console.log("\n✅ Done! Verify these URLs in browser:");
  console.log(`  Avatar: ${publicBase}/avatars/profile-avatar.png`);
  console.log(`  Photo 1: ${publicBase}/photos/progress-2026-05-28-1.png`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
