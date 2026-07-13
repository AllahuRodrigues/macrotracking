import { API_BASE_URL } from "@/lib/config";
import { getAccessCode } from "@/lib/auth";
import { ACCESS_CODE_HEADER } from "@shared/access";
import type {
  FoodEntry,
  BodyMetric,
  PhotoEntry,
  Supplement,
  DailyMacroSummary,
  WorkoutTemplate,
  TemplateExercise,
  WorkoutSession,
  SessionExercise,
  UserProfile,
} from "@shared/types";

async function authHeaders(extra: Record<string, string> = {}) {
  const code = await getAccessCode();
  const headers: Record<string, string> = { ...extra };
  if (code) headers[ACCESS_CODE_HEADER] = code;
  return headers;
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = await authHeaders(
    (init.headers as Record<string, string>) ?? {}
  );
  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

async function jsonReq<T>(
  path: string,
  method: string,
  body: unknown
): Promise<T> {
  return req<T>(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ── Stats / dashboard ────────────────────────────────────────────────────────
export type DaySummary = {
  date: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  entry_count: number;
  from_meals?: number;
  from_supplements?: number;
};

export const api = {
  // Food
  getEntries: (date?: string) =>
    req<FoodEntry[]>(`/api/entries${date ? `?date=${date}` : ""}`),
  createEntry: (data: Partial<FoodEntry>) =>
    jsonReq<FoodEntry>("/api/entries", "POST", data),
  updateEntry: (id: string, data: Partial<FoodEntry>) =>
    jsonReq<FoodEntry>(`/api/entries/${id}`, "PUT", data),
  deleteEntry: (id: string) =>
    req<{ ok: true }>(`/api/entries/${id}`, { method: "DELETE" }),

  // Stats
  getDaySummary: (date: string) =>
    req<DaySummary>(`/api/stats?date=${date}`),
  getTrends: (days = 30) =>
    req<{ macros: DailyMacroSummary[]; body: BodyMetric[] }>(
      `/api/stats?days=${days}`
    ),

  // Body
  getBody: (limit?: number) =>
    req<BodyMetric[]>(`/api/body${limit ? `?limit=${limit}` : ""}`),
  createBody: (data: Partial<BodyMetric>) =>
    jsonReq<BodyMetric>("/api/body", "POST", data),
  updateBody: (id: string, data: Partial<BodyMetric>) =>
    jsonReq<BodyMetric>(`/api/body/${id}`, "PUT", data),
  deleteBody: (id: string) =>
    req<{ ok: true }>(`/api/body/${id}`, { method: "DELETE" }),

  // Photos
  getPhotos: (category?: string) =>
    req<PhotoEntry[]>(`/api/photos${category ? `?category=${category}` : ""}`),
  deletePhoto: (id: string) =>
    req<{ ok: true }>(`/api/photos/${id}`, { method: "DELETE" }),
  uploadPhoto: async (
    fileUri: string,
    fields: { date?: string; category?: string; caption?: string }
  ) => {
    const form = new FormData();
    const name = fileUri.split("/").pop() ?? "photo.jpg";
    const ext = name.split(".").pop()?.toLowerCase() ?? "jpg";
    // React Native FormData file shape
    form.append("file", {
      uri: fileUri,
      name,
      type: ext === "png" ? "image/png" : "image/jpeg",
    } as unknown as Blob);
    if (fields.date) form.append("date", fields.date);
    if (fields.category) form.append("category", fields.category);
    if (fields.caption) form.append("caption", fields.caption);
    return req<PhotoEntry>("/api/photos", { method: "POST", body: form });
  },

  // Supplements
  getSupplements: (activeOnly = false) =>
    req<Supplement[]>(`/api/supplements${activeOnly ? "?active=1" : ""}`),
  getSupplementIntake: (date: string) =>
    req<{
      date: string;
      supplements: Supplement[];
      due_supplements: Supplement[];
      taken_ids: string[];
      quantities: Record<string, number>;
      taken: number;
      total: number;
    }>(`/api/supplement-intake?date=${date}`),
  toggleSupplement: (
    date: string,
    supplement_id: string,
    taken: boolean,
    quantity?: number
  ) =>
    jsonReq("/api/supplement-intake", "POST", {
      action: "toggle",
      date,
      supplement_id,
      taken,
      quantity,
    }),

  // Water
  getWater: (date: string) =>
    req<{ date: string; total_ml: number }>(`/api/water?date=${date}`),
  addWater: (date: string, amount_ml: number) =>
    jsonReq<{ total_ml: number }>("/api/water", "POST", { date, amount_ml }),
  resetWater: (date: string) =>
    req<{ ok: true }>(`/api/water?date=${date}`, { method: "DELETE" }),

  // Workouts
  getSession: (date: string) =>
    req<{ session: WorkoutSession; exercises: SessionExercise[] } | null>(
      `/api/workouts?date=${date}`
    ),
  getHistory: (limit = 30) =>
    req<WorkoutSession[]>(`/api/workouts?limit=${limit}`),
  getProgram: () =>
    req<{ template: WorkoutTemplate; exercises: TemplateExercise[] }[]>(
      "/api/templates"
    ),
  getTemplateForDay: (day: number) =>
    req<{ template: WorkoutTemplate; exercises: TemplateExercise[] } | null>(
      `/api/templates?day=${day}`
    ),

  // Profile
  getProfile: () => req<UserProfile | null>("/api/profile"),

  // Export
  exportUrl: () => `${API_BASE_URL}/api/export`,
};
