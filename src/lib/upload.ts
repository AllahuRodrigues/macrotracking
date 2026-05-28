import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { getUploadsDir } from "./db";
import { uploadToStorage } from "./storage";
import { useSupabase } from "./supabase-client";

export async function saveUploadedFile(
  file: File,
  folder: "photos" | "avatars"
): Promise<{ filename: string; contentType: string }> {
  const ext = path.extname(file.name) || ".jpg";
  const contentType = file.type || "image/jpeg";
  const buffer = Buffer.from(await file.arrayBuffer());

  if (useSupabase()) {
    const storagePath = `${folder}/${uuidv4()}${ext}`;
    await uploadToStorage(storagePath, buffer, contentType);
    return { filename: storagePath, contentType };
  }

  const localName = folder === "avatars" ? `profile-avatar${ext}` : `${uuidv4()}${ext}`;
  const uploadsDir = getUploadsDir();
  fs.writeFileSync(path.join(uploadsDir, localName), buffer);
  return { filename: localName, contentType };
}

export async function saveUploadedBuffer(
  buffer: Buffer,
  folder: "photos" | "avatars",
  ext: string,
  contentType: string,
  fixedName?: string
): Promise<string> {
  if (useSupabase()) {
    const storagePath = fixedName
      ? `${folder}/${fixedName}`
      : `${folder}/${uuidv4()}${ext}`;
    await uploadToStorage(storagePath, buffer, contentType);
    return storagePath;
  }

  const localName = fixedName ?? `${uuidv4()}${ext}`;
  fs.writeFileSync(path.join(getUploadsDir(), localName), buffer);
  return localName;
}
