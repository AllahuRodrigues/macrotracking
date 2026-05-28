import { getSupabase, getSupabaseUrl, useSupabase } from "./supabase-client";

export const STORAGE_BUCKET = "uploads";

export async function uploadToStorage(
  storagePath: string,
  data: Buffer | ArrayBuffer,
  contentType: string
): Promise<string> {
  const supabase = getSupabase();
  const body =
    data instanceof Buffer
      ? data
      : Buffer.from(data instanceof ArrayBuffer ? new Uint8Array(data) : data);
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(storagePath, body, {
    contentType,
    upsert: true,
  });
  if (error) throw error;
  return storagePath;
}

export async function deleteFromStorage(storagePath: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
  if (error) throw error;
}

/** Public URL for a file — Supabase Storage or local /uploads */
export function getImageUrl(filename: string): string {
  if (!filename) return "";
  if (filename.startsWith("http://") || filename.startsWith("https://")) {
    return filename;
  }
  // Use NEXT_PUBLIC_SUPABASE_URL so this works in the browser too
  const base = getSupabaseUrl();
  if (base) {
    return `${base}/storage/v1/object/public/${STORAGE_BUCKET}/${filename}`;
  }
  return `/uploads/${filename}`;
}

export function isRemoteStorage(): boolean {
  return !!getSupabaseUrl();
}
