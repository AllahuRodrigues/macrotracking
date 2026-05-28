import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import type {
  BodyMetric,
  FoodEntry,
  PhotoEntry,
  Supplement,
  SupplementIntake,
  UserProfile,
  WorkoutTemplate,
  TemplateExercise,
  WorkoutSession,
  SessionExercise,
  WaterLog,
} from "./types";
import { getSupabase } from "./supabase-client";
import { deleteFromStorage } from "./storage";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

function ensureDirs() {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export function getUploadsDir() {
  ensureDirs();
  return UPLOADS_DIR;
}

// ── Food Entries ──

export async function getFoodEntries(date?: string): Promise<FoodEntry[]> {
  const supabase = getSupabase();
  let query = supabase.from("food_entries").select("*");
  if (date) {
    query = query.eq("date", date).order("created_at", { ascending: true });
  } else {
    query = query.order("date", { ascending: false }).order("created_at", { ascending: true });
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as FoodEntry[];
}

export async function createFoodEntry(
  data: Omit<FoodEntry, "id" | "created_at">
): Promise<FoodEntry> {
  const supabase = getSupabase();
  const entry: FoodEntry = {
    id: uuidv4(),
    ...data,
    notes: data.notes ?? undefined,
    created_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("food_entries").insert({
    id: entry.id,
    date: entry.date,
    meal_type: entry.meal_type,
    name: entry.name,
    calories: entry.calories,
    protein: entry.protein,
    fat: entry.fat,
    carbs: entry.carbs,
    notes: entry.notes ?? null,
    created_at: entry.created_at,
  });
  if (error) throw error;
  return entry;
}

export async function updateFoodEntry(
  id: string,
  data: Partial<Omit<FoodEntry, "id" | "created_at">>
): Promise<FoodEntry | null> {
  const supabase = getSupabase();
  const { data: existing, error: fetchError } = await supabase
    .from("food_entries")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!existing) return null;

  const updated = { ...existing, ...data } as FoodEntry;
  const { error } = await supabase
    .from("food_entries")
    .update({
      date: updated.date,
      meal_type: updated.meal_type,
      name: updated.name,
      calories: updated.calories,
      protein: updated.protein,
      fat: updated.fat,
      carbs: updated.carbs,
      notes: updated.notes ?? null,
    })
    .eq("id", id);
  if (error) throw error;
  return updated;
}

export async function deleteFoodEntry(id: string): Promise<boolean> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("food_entries").delete().eq("id", id).select("id");
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

// ── Body Metrics ──

export async function getBodyMetrics(limit?: number): Promise<BodyMetric[]> {
  const supabase = getSupabase();
  let query = supabase.from("body_metrics").select("*").order("date", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as BodyMetric[];
}

export async function getBodyMetricByDate(date: string): Promise<BodyMetric | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("body_metrics")
    .select("*")
    .eq("date", date)
    .maybeSingle();
  if (error) throw error;
  return (data as BodyMetric | null) ?? null;
}

export async function createBodyMetric(
  data: Omit<BodyMetric, "id" | "created_at">
): Promise<BodyMetric> {
  const supabase = getSupabase();
  const entry: BodyMetric = {
    id: uuidv4(),
    ...data,
    created_at: new Date().toISOString(),
  };
  const row = {
    id: entry.id,
    date: entry.date,
    weight_lbs: entry.weight_lbs ?? null,
    body_fat_pct: entry.body_fat_pct ?? null,
    muscle_mass_lbs: entry.muscle_mass_lbs ?? null,
    skeletal_muscle_lbs: entry.skeletal_muscle_lbs ?? null,
    bmi: entry.bmi ?? null,
    visceral_fat: entry.visceral_fat ?? null,
    inbody_score: entry.inbody_score ?? null,
    body_water_pct: entry.body_water_pct ?? null,
    bmr: entry.bmr ?? null,
    notes: entry.notes ?? null,
    created_at: entry.created_at,
  };
  const { error } = await supabase.from("body_metrics").insert(row);
  if (error) throw error;
  return entry;
}

export async function updateBodyMetric(
  id: string,
  data: Partial<Omit<BodyMetric, "id" | "created_at">>
): Promise<BodyMetric | null> {
  const supabase = getSupabase();
  const { data: existing, error: fetchError } = await supabase
    .from("body_metrics")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!existing) return null;

  const merged = { ...existing, ...data } as BodyMetric;
  const { error } = await supabase
    .from("body_metrics")
    .update({
      date: merged.date,
      weight_lbs: merged.weight_lbs ?? null,
      body_fat_pct: merged.body_fat_pct ?? null,
      muscle_mass_lbs: merged.muscle_mass_lbs ?? null,
      skeletal_muscle_lbs: merged.skeletal_muscle_lbs ?? null,
      bmi: merged.bmi ?? null,
      visceral_fat: merged.visceral_fat ?? null,
      inbody_score: merged.inbody_score ?? null,
      body_water_pct: merged.body_water_pct ?? null,
      bmr: merged.bmr ?? null,
      notes: merged.notes ?? null,
    })
    .eq("id", id);
  if (error) throw error;
  return merged;
}

export async function deleteBodyMetric(id: string): Promise<boolean> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("body_metrics").delete().eq("id", id).select("id");
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

// ── Photos ──

export async function getPhotos(category?: string): Promise<PhotoEntry[]> {
  const supabase = getSupabase();
  let query = supabase.from("photos").select("*").order("date", { ascending: false });
  if (category) query = query.eq("category", category);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as PhotoEntry[];
}

export async function createPhoto(
  data: Omit<PhotoEntry, "id" | "created_at">
): Promise<PhotoEntry> {
  const supabase = getSupabase();
  const entry: PhotoEntry = {
    id: uuidv4(),
    ...data,
    created_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("photos").insert({
    id: entry.id,
    date: entry.date,
    category: entry.category,
    filename: entry.filename,
    caption: entry.caption ?? null,
    created_at: entry.created_at,
  });
  if (error) throw error;
  return entry;
}

export async function deletePhoto(id: string): Promise<boolean> {
  const supabase = getSupabase();
  const { data: photo, error: fetchError } = await supabase
    .from("photos")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!photo) return false;

  try {
    await deleteFromStorage(photo.filename);
  } catch {
    const filePath = path.join(UPLOADS_DIR, photo.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  const { data, error } = await supabase.from("photos").delete().eq("id", id).select("id");
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

// ── Stats ──

export async function getDailyMacroSummaries(days = 30) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("food_entries")
    .select("date, calories, protein, fat, carbs")
    .order("date", { ascending: false });
  if (error) throw error;

  const byDate = new Map<
    string,
    { calories: number; protein: number; fat: number; carbs: number; entry_count: number }
  >();

  for (const row of data ?? []) {
    const existing = byDate.get(row.date) ?? {
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      entry_count: 0,
    };
    existing.calories += Number(row.calories);
    existing.protein += Number(row.protein);
    existing.fat += Number(row.fat);
    existing.carbs += Number(row.carbs);
    existing.entry_count += 1;
    byDate.set(row.date, existing);
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, days)
    .map(([date, sums]) => ({ date, ...sums }));
}

export async function getMacroSummaryForDate(date: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("food_entries")
    .select("calories, protein, fat, carbs")
    .eq("date", date);
  if (error) throw error;

  const rows = data ?? [];
  return {
    date,
    calories: rows.reduce((sum, r) => sum + Number(r.calories), 0),
    protein: rows.reduce((sum, r) => sum + Number(r.protein), 0),
    fat: rows.reduce((sum, r) => sum + Number(r.fat), 0),
    carbs: rows.reduce((sum, r) => sum + Number(r.carbs), 0),
    entry_count: rows.length,
  };
}

// ── Workout Templates ──

export async function getWorkoutTemplates(): Promise<WorkoutTemplate[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("workout_templates")
    .select("*")
    .order("week_day", { ascending: true });
  if (error) throw error;
  return (data ?? []) as WorkoutTemplate[];
}

export async function getTemplateForDay(weekDay: number): Promise<WorkoutTemplate | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("workout_templates")
    .select("*")
    .eq("week_day", weekDay)
    .maybeSingle();
  if (error) throw error;
  return (data as WorkoutTemplate | null) ?? null;
}

export async function getTemplateExercises(templateId: string): Promise<TemplateExercise[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("template_exercises")
    .select("*")
    .eq("template_id", templateId)
    .order("order_idx", { ascending: true });
  if (error) throw error;
  return (data ?? []) as TemplateExercise[];
}

// ── Workout Sessions ──

export async function getWorkoutSessions(limit = 30): Promise<WorkoutSession[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as WorkoutSession[];
}

export async function getSessionForDate(date: string): Promise<WorkoutSession | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("date", date)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as WorkoutSession | null) ?? null;
}

export async function createWorkoutSession(
  data: Omit<WorkoutSession, "id" | "created_at">
): Promise<WorkoutSession> {
  const supabase = getSupabase();
  const session: WorkoutSession = {
    id: uuidv4(),
    ...data,
    created_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("workout_sessions").insert({
    id: session.id,
    date: session.date,
    template_id: session.template_id ?? null,
    name: session.name,
    duration_min: session.duration_min ?? null,
    cardio_done: session.cardio_done,
    cardio_min: session.cardio_min ?? null,
    notes: session.notes ?? null,
    created_at: session.created_at,
  });
  if (error) throw error;
  return session;
}

export async function updateWorkoutSession(
  id: string,
  data: Partial<Omit<WorkoutSession, "id" | "created_at">>
): Promise<WorkoutSession | null> {
  const supabase = getSupabase();
  const { data: existing, error: fetchError } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!existing) return null;

  const merged = { ...existing, ...data } as WorkoutSession;
  const { error } = await supabase
    .from("workout_sessions")
    .update({
      date: merged.date,
      template_id: merged.template_id ?? null,
      name: merged.name,
      duration_min: merged.duration_min ?? null,
      cardio_done: merged.cardio_done,
      cardio_min: merged.cardio_min ?? null,
      notes: merged.notes ?? null,
    })
    .eq("id", id);
  if (error) throw error;
  return merged;
}

export async function deleteWorkoutSession(id: string): Promise<boolean> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("workout_sessions")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

// ── Session Exercises ──

export async function getSessionExercises(sessionId: string): Promise<SessionExercise[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("session_exercises")
    .select("*")
    .eq("session_id", sessionId)
    .order("order_idx", { ascending: true });
  if (error) throw error;
  return (data ?? []) as SessionExercise[];
}

export async function upsertSessionExercise(
  data: Omit<SessionExercise, "id"> & { id?: string }
): Promise<SessionExercise> {
  const supabase = getSupabase();
  const id = data.id ?? uuidv4();
  const row = {
    id,
    session_id: data.session_id,
    template_exercise_id: data.template_exercise_id ?? null,
    name: data.name,
    sets_prescribed: data.sets_prescribed,
    reps_prescribed: data.reps_prescribed,
    sets_data: data.sets_data,
    order_idx: data.order_idx,
    notes: data.notes ?? null,
  };

  if (data.id) {
    const { data: existing, error: fetchError } = await supabase
      .from("session_exercises")
      .select("id")
      .eq("id", data.id)
      .maybeSingle();
    if (fetchError) throw fetchError;

    if (existing) {
      const { error } = await supabase
        .from("session_exercises")
        .update({ sets_data: row.sets_data, notes: row.notes })
        .eq("id", id);
      if (error) throw error;
      return { ...data, id } as SessionExercise;
    }
  }

  const { error } = await supabase.from("session_exercises").insert(row);
  if (error) throw error;
  return { ...data, id } as SessionExercise;
}

// ── Water Logs ──

export async function getWaterLogForDate(date: string): Promise<WaterLog[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("water_logs")
    .select("*")
    .eq("date", date)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as WaterLog[];
}

export async function getTotalWaterForDate(date: string): Promise<number> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("water_logs")
    .select("amount_ml")
    .eq("date", date);
  if (error) throw error;
  return (data ?? []).reduce((sum, row) => sum + Number(row.amount_ml), 0);
}

export async function addWaterLog(date: string, amount_ml: number): Promise<WaterLog> {
  const supabase = getSupabase();
  const entry: WaterLog = {
    id: uuidv4(),
    date,
    amount_ml,
    created_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("water_logs").insert(entry);
  if (error) throw error;
  return entry;
}

export async function deleteWaterLog(id: string): Promise<boolean> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("water_logs").delete().eq("id", id).select("id");
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export async function resetWaterForDate(date: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("water_logs").delete().eq("date", date);
  if (error) throw error;
}

// ── Supplements ──

export async function getSupplements(activeOnly = false): Promise<Supplement[]> {
  const supabase = getSupabase();
  let query = supabase.from("supplements").select("*").order("category").order("name");
  if (activeOnly) query = query.eq("active", 1);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Supplement[];
}

export async function createSupplement(
  data: Omit<Supplement, "id" | "created_at">
): Promise<Supplement> {
  const supabase = getSupabase();
  const entry: Supplement = {
    id: uuidv4(),
    ...data,
    created_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("supplements").insert({
    id: entry.id,
    name: entry.name,
    brand: entry.brand ?? null,
    dose: entry.dose ?? null,
    category: entry.category,
    timing: entry.timing ?? null,
    frequency: entry.frequency ?? "daily",
    notes: entry.notes ?? null,
    active: entry.active,
    created_at: entry.created_at,
  });
  if (error) throw error;
  return entry;
}

export async function updateSupplement(
  id: string,
  data: Partial<Omit<Supplement, "id" | "created_at">>
): Promise<Supplement | null> {
  const supabase = getSupabase();
  const { data: existing, error: fetchError } = await supabase
    .from("supplements")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!existing) return null;

  const updated = { ...existing, ...data } as Supplement;
  const { error } = await supabase
    .from("supplements")
    .update({
      name: updated.name,
      brand: updated.brand ?? null,
      dose: updated.dose ?? null,
      category: updated.category,
      timing: updated.timing ?? null,
      frequency: updated.frequency ?? "daily",
      notes: updated.notes ?? null,
      active: updated.active,
    })
    .eq("id", id);
  if (error) throw error;
  return updated;
}

export async function deleteSupplement(id: string): Promise<boolean> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("supplements").delete().eq("id", id).select("id");
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

// ── Supplement Intakes ──

export async function getSupplementIntakesForDate(date: string): Promise<SupplementIntake[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("supplement_intakes")
    .select("*")
    .eq("date", date);
  if (error) throw error;
  return (data ?? []) as SupplementIntake[];
}

export async function toggleSupplementIntake(
  date: string,
  supplementId: string,
  taken: boolean
): Promise<SupplementIntake | null> {
  const supabase = getSupabase();
  const { data: existing, error: fetchError } = await supabase
    .from("supplement_intakes")
    .select("*")
    .eq("date", date)
    .eq("supplement_id", supplementId)
    .maybeSingle();
  if (fetchError) throw fetchError;

  if (taken) {
    if (existing) {
      const { error } = await supabase
        .from("supplement_intakes")
        .update({ taken: 1 })
        .eq("id", existing.id);
      if (error) throw error;
      return { ...existing, taken: 1 } as SupplementIntake;
    }
    const entry: SupplementIntake = {
      id: uuidv4(),
      date,
      supplement_id: supplementId,
      taken: 1,
      created_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("supplement_intakes").insert(entry);
    if (error) throw error;
    return entry;
  }

  if (existing) {
    const { error } = await supabase.from("supplement_intakes").delete().eq("id", existing.id);
    if (error) throw error;
  }
  return null;
}

export async function markAllSupplementsForDate(
  date: string,
  supplementIds: string[]
): Promise<void> {
  const supabase = getSupabase();
  const now = new Date().toISOString();
  const rows = supplementIds.map((supplement_id) => ({
    id: uuidv4(),
    date,
    supplement_id,
    taken: 1,
    created_at: now,
  }));
  const { error } = await supabase
    .from("supplement_intakes")
    .upsert(rows, { onConflict: "date,supplement_id", ignoreDuplicates: true });
  if (error) throw error;
}

export async function getSupplementIntakeHistory(days = 14) {
  const supabase = getSupabase();

  const { count: activeCount, error: countError } = await supabase
    .from("supplements")
    .select("*", { count: "exact", head: true })
    .eq("active", 1);
  if (countError) throw countError;

  const { data, error } = await supabase
    .from("supplement_intakes")
    .select("date")
    .eq("taken", 1)
    .order("date", { ascending: false });
  if (error) throw error;

  const byDate = new Map<string, number>();
  for (const row of data ?? []) {
    byDate.set(row.date, (byDate.get(row.date) ?? 0) + 1);
  }

  const total = activeCount ?? 0;
  return Array.from(byDate.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, days)
    .map(([date, taken]) => ({
      date,
      taken,
      total,
      pct: total > 0 ? Math.round((taken / total) * 100) : 0,
    }));
}

// ── User Profile ──

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("user_profile")
    .select("*")
    .eq("id", "me")
    .maybeSingle();
  if (error) throw error;
  return (data as UserProfile | null) ?? null;
}

export async function upsertUserProfile(
  data: Partial<Omit<UserProfile, "id" | "updated_at">>
): Promise<UserProfile> {
  const supabase = getSupabase();
  const existing = await getUserProfile();
  const now = new Date().toISOString();

  if (existing) {
    const updated = { ...existing, ...data, updated_at: now };
    const { error } = await supabase
      .from("user_profile")
      .update({
        name: updated.name ?? null,
        age: updated.age ?? null,
        height: updated.height ?? null,
        goal: updated.goal ?? null,
        avatar_filename: updated.avatar_filename ?? null,
        target_calories: updated.target_calories ?? null,
        target_protein: updated.target_protein ?? null,
        target_fat: updated.target_fat ?? null,
        target_carbs: updated.target_carbs ?? null,
        notes: updated.notes ?? null,
        updated_at: updated.updated_at,
      })
      .eq("id", "me");
    if (error) throw error;
    return updated;
  }

  const profile: UserProfile = {
    id: "me",
    ...data,
    updated_at: now,
  } as UserProfile;
  const { error } = await supabase.from("user_profile").insert({
    id: profile.id,
    name: profile.name ?? null,
    age: profile.age ?? null,
    height: profile.height ?? null,
    goal: profile.goal ?? null,
    avatar_filename: profile.avatar_filename ?? null,
    target_calories: profile.target_calories ?? null,
    target_protein: profile.target_protein ?? null,
    target_fat: profile.target_fat ?? null,
    target_carbs: profile.target_carbs ?? null,
    notes: profile.notes ?? null,
    updated_at: profile.updated_at,
  });
  if (error) throw error;
  return profile;
}
