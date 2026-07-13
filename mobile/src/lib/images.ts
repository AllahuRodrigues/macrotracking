import Constants from "expo-constants";

const SUPABASE_URL: string =
  (Constants.expoConfig?.extra?.supabaseUrl as string | undefined) ?? "";

const BUCKET = "uploads";

/**
 * Turn a stored photo `filename` (e.g. "photos/abc.png") into a public URL.
 * Absolute URLs are returned unchanged.
 */
export function imageUrl(filename?: string | null): string | null {
  if (!filename) return null;
  if (filename.startsWith("http")) return filename;
  if (!SUPABASE_URL) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`;
}
