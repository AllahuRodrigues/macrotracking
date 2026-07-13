import { API_BASE_URL } from "@/lib/config";
import { getAccessCode } from "@/lib/auth";
import { ACCESS_CODE_HEADER } from "@shared/access";
import type { InsightsPayload } from "@shared/insights";
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
  DailyCheckin,
  SessionSet,
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

  startSession: (data: {
    date: string;
    template_id?: string;
    name: string;
    notes?: string;
  }) =>
    jsonReq<WorkoutSession>("/api/workouts", "POST", { type: "session", data }),

  upsertSessionExercise: (data: Partial<SessionExercise> & { session_id: string; name: string }) =>
    jsonReq<SessionExercise>("/api/workouts", "POST", { type: "exercise", data }),

  logSet: async (
    exercise: SessionExercise,
    weight: number,
    reps: number
  ): Promise<SessionExercise> => {
    const sets: SessionSet[] = JSON.parse(exercise.sets_data || "[]");
    sets.push({ set_num: sets.length + 1, weight_lbs: weight, reps, done: true });
    return req<SessionExercise>(`/api/workouts/${exercise.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "exercise",
        data: { sets_data: JSON.stringify(sets) },
      }),
    });
  },

  markCardio: (sessionId: string, done: boolean, min = 30) =>
    req(`/api/workouts/${sessionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardio_done: done ? 1 : 0, cardio_min: done ? min : 0 }),
    }),

  // Profile
  getProfile: () => req<UserProfile | null>("/api/profile"),

  getCheckin: (date: string) =>
    req<DailyCheckin>(`/api/checkin?date=${date}`),
  saveCheckin: (data: DailyCheckin) =>
    jsonReq<DailyCheckin>("/api/checkin", "POST", data),

  getReport: (date?: string) =>
    req<{
      meal_risk: {
        level: "low" | "medium" | "high";
        remaining_kcal: number;
        probability_pct: number;
        headline: string;
        body: string;
        suggestions: string[];
      };
      weekly_report: {
        week_label: string;
        avg_calories: number;
        avg_protein: number;
        calorie_hit_rate: number;
        protein_hit_rate: number;
        biggest_problem: string;
        wins: string[];
        next_week_focus: string[];
        estimated_weight_change_lbs: number | null;
      };
      coaching: InsightsPayload["coaching"];
      execution: InsightsPayload["execution"];
      weight: InsightsPayload["weight"];
    }>(`/api/report${date ? `?date=${date}` : ""}`),

  // AI food analysis
  analyzeFood: (image: string, hint?: string) =>
    jsonReq<AnalyzeFoodResult>("/api/analyze-food", "POST", { image, hint }),
  getAiUsage: () =>
    req<{
      date: string;
      spent_usd: number;
      requests: number;
      budget_usd: number;
      remaining_usd: number;
    }>("/api/analyze-food"),

  getInsights: (days = 60) => req<InsightsPayload>(`/api/insights?days=${days}`),

  // Export
  exportUrl: () => `${API_BASE_URL}/api/export`,
};

export type AnalyzedFoodItem = {
  name: string;
  quantity?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence?: "low" | "medium" | "high";
};

export type AnalyzeFoodResult = {
  items: AnalyzedFoodItem[];
  summary: string;
  totals: { calories: number; protein: number; carbs: number; fat: number };
  cost_usd: number;
};
