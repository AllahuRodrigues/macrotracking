import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import type {
  BodyMetric, FoodEntry, PhotoEntry, Supplement, SupplementIntake, UserProfile,
  WorkoutTemplate, TemplateExercise, WorkoutSession, SessionExercise, WaterLog,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "macro-tracking.db");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  ensureDirs();
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS food_entries (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      name TEXT NOT NULL,
      calories REAL NOT NULL DEFAULT 0,
      protein REAL NOT NULL DEFAULT 0,
      fat REAL NOT NULL DEFAULT 0,
      carbs REAL NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS body_metrics (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      weight_lbs REAL,
      body_fat_pct REAL,
      muscle_mass_lbs REAL,
      skeletal_muscle_lbs REAL,
      bmi REAL,
      visceral_fat REAL,
      inbody_score REAL,
      body_water_pct REAL,
      bmr REAL,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      filename TEXT NOT NULL,
      caption TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS supplements (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand TEXT,
      dose TEXT,
      category TEXT NOT NULL DEFAULT 'other',
      timing TEXT,
      frequency TEXT DEFAULT 'daily',
      notes TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS supplement_intakes (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      supplement_id TEXT NOT NULL,
      taken INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      UNIQUE(date, supplement_id)
    );

    CREATE TABLE IF NOT EXISTS user_profile (
      id TEXT NOT NULL DEFAULT 'me' PRIMARY KEY,
      name TEXT,
      age INTEGER,
      height TEXT,
      goal TEXT,
      avatar_filename TEXT,
      target_calories INTEGER,
      target_protein INTEGER,
      target_fat INTEGER,
      target_carbs INTEGER,
      notes TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_templates (
      id TEXT PRIMARY KEY,
      week_day INTEGER NOT NULL,
      day_name TEXT NOT NULL,
      label TEXT NOT NULL,
      muscle_groups TEXT NOT NULL DEFAULT '',
      goal TEXT NOT NULL DEFAULT '',
      cardio TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS template_exercises (
      id TEXT PRIMARY KEY,
      template_id TEXT NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      sets_prescribed TEXT NOT NULL DEFAULT '3',
      reps_prescribed TEXT NOT NULL DEFAULT '8-12',
      order_idx INTEGER NOT NULL DEFAULT 0,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS workout_sessions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      template_id TEXT REFERENCES workout_templates(id),
      name TEXT NOT NULL,
      duration_min INTEGER,
      cardio_done INTEGER NOT NULL DEFAULT 0,
      cardio_min INTEGER,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS session_exercises (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
      template_exercise_id TEXT,
      name TEXT NOT NULL,
      sets_prescribed TEXT NOT NULL DEFAULT '3',
      reps_prescribed TEXT NOT NULL DEFAULT '8-12',
      sets_data TEXT NOT NULL DEFAULT '[]',
      order_idx INTEGER NOT NULL DEFAULT 0,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS water_logs (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      amount_ml INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_food_date ON food_entries(date);
    CREATE INDEX IF NOT EXISTS idx_body_date ON body_metrics(date);
    CREATE INDEX IF NOT EXISTS idx_photos_date ON photos(date);
  `);

  return db;
}

export function getUploadsDir() {
  ensureDirs();
  return UPLOADS_DIR;
}

// ── Food Entries ──

export function getFoodEntries(date?: string): FoodEntry[] {
  const database = getDb();
  if (date) {
    return database
      .prepare("SELECT * FROM food_entries WHERE date = ? ORDER BY created_at ASC")
      .all(date) as FoodEntry[];
  }
  return database
    .prepare("SELECT * FROM food_entries ORDER BY date DESC, created_at ASC")
    .all() as FoodEntry[];
}

export function createFoodEntry(
  data: Omit<FoodEntry, "id" | "created_at">
): FoodEntry {
  const database = getDb();
  const entry: FoodEntry = {
    id: uuidv4(),
    ...data,
    created_at: new Date().toISOString(),
  };
  database
    .prepare(
      `INSERT INTO food_entries (id, date, meal_type, name, calories, protein, fat, carbs, notes, created_at)
       VALUES (@id, @date, @meal_type, @name, @calories, @protein, @fat, @carbs, @notes, @created_at)`
    )
    .run(entry);
  return entry;
}

export function updateFoodEntry(
  id: string,
  data: Partial<Omit<FoodEntry, "id" | "created_at">>
): FoodEntry | null {
  const database = getDb();
  const existing = database
    .prepare("SELECT * FROM food_entries WHERE id = ?")
    .get(id) as FoodEntry | undefined;
  if (!existing) return null;

  const updated = { ...existing, ...data };
  database
    .prepare(
      `UPDATE food_entries SET date=@date, meal_type=@meal_type, name=@name,
       calories=@calories, protein=@protein, fat=@fat, carbs=@carbs, notes=@notes
       WHERE id=@id`
    )
    .run(updated);
  return updated;
}

export function deleteFoodEntry(id: string): boolean {
  const database = getDb();
  const result = database.prepare("DELETE FROM food_entries WHERE id = ?").run(id);
  return result.changes > 0;
}

// ── Body Metrics ──

export function getBodyMetrics(limit?: number): BodyMetric[] {
  const database = getDb();
  if (limit) {
    return database
      .prepare("SELECT * FROM body_metrics ORDER BY date DESC LIMIT ?")
      .all(limit) as BodyMetric[];
  }
  return database
    .prepare("SELECT * FROM body_metrics ORDER BY date DESC")
    .all() as BodyMetric[];
}

export function getBodyMetricByDate(date: string): BodyMetric | null {
  const database = getDb();
  return (
    (database
      .prepare("SELECT * FROM body_metrics WHERE date = ?")
      .get(date) as BodyMetric | undefined) ?? null
  );
}

export function createBodyMetric(
  data: Omit<BodyMetric, "id" | "created_at">
): BodyMetric {
  const database = getDb();
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
  database
    .prepare(
      `INSERT INTO body_metrics (id, date, weight_lbs, body_fat_pct, muscle_mass_lbs,
       skeletal_muscle_lbs, bmi, visceral_fat, inbody_score, body_water_pct, bmr, notes, created_at)
       VALUES (@id, @date, @weight_lbs, @body_fat_pct, @muscle_mass_lbs, @skeletal_muscle_lbs,
       @bmi, @visceral_fat, @inbody_score, @body_water_pct, @bmr, @notes, @created_at)`
    )
    .run(row);
  return entry;
}

export function updateBodyMetric(
  id: string,
  data: Partial<Omit<BodyMetric, "id" | "created_at">>
): BodyMetric | null {
  const database = getDb();
  const existing = database
    .prepare("SELECT * FROM body_metrics WHERE id = ?")
    .get(id) as BodyMetric | undefined;
  if (!existing) return null;

  const merged = { ...existing, ...data };
  const row = {
    id: merged.id,
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
  };
  database
    .prepare(
      `UPDATE body_metrics SET date=@date, weight_lbs=@weight_lbs, body_fat_pct=@body_fat_pct,
       muscle_mass_lbs=@muscle_mass_lbs, skeletal_muscle_lbs=@skeletal_muscle_lbs, bmi=@bmi,
       visceral_fat=@visceral_fat, inbody_score=@inbody_score, body_water_pct=@body_water_pct,
       bmr=@bmr, notes=@notes WHERE id=@id`
    )
    .run(row);
  return merged;
}

export function deleteBodyMetric(id: string): boolean {
  const database = getDb();
  const result = database.prepare("DELETE FROM body_metrics WHERE id = ?").run(id);
  return result.changes > 0;
}

// ── Photos ──

export function getPhotos(category?: string): PhotoEntry[] {
  const database = getDb();
  if (category) {
    return database
      .prepare("SELECT * FROM photos WHERE category = ? ORDER BY date DESC")
      .all(category) as PhotoEntry[];
  }
  return database
    .prepare("SELECT * FROM photos ORDER BY date DESC")
    .all() as PhotoEntry[];
}

export function createPhoto(
  data: Omit<PhotoEntry, "id" | "created_at">
): PhotoEntry {
  const database = getDb();
  const entry: PhotoEntry = {
    id: uuidv4(),
    ...data,
    created_at: new Date().toISOString(),
  };
  database
    .prepare(
      `INSERT INTO photos (id, date, category, filename, caption, created_at)
       VALUES (@id, @date, @category, @filename, @caption, @created_at)`
    )
    .run(entry);
  return entry;
}

export function deletePhoto(id: string): boolean {
  const database = getDb();
  const photo = database
    .prepare("SELECT * FROM photos WHERE id = ?")
    .get(id) as PhotoEntry | undefined;
  if (!photo) return false;

  const filePath = path.join(UPLOADS_DIR, photo.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  const result = database.prepare("DELETE FROM photos WHERE id = ?").run(id);
  return result.changes > 0;
}

// ── Stats ──

export function getDailyMacroSummaries(days = 30) {
  const database = getDb();
  return database
    .prepare(
      `SELECT date,
              SUM(calories) as calories,
              SUM(protein) as protein,
              SUM(fat) as fat,
              SUM(carbs) as carbs,
              COUNT(*) as entry_count
       FROM food_entries
       GROUP BY date
       ORDER BY date DESC
       LIMIT ?`
    )
    .all(days);
}

export function getMacroSummaryForDate(date: string) {
  const database = getDb();
  return database
    .prepare(
      `SELECT date,
              COALESCE(SUM(calories), 0) as calories,
              COALESCE(SUM(protein), 0) as protein,
              COALESCE(SUM(fat), 0) as fat,
              COALESCE(SUM(carbs), 0) as carbs,
              COUNT(*) as entry_count
       FROM food_entries WHERE date = ?`
    )
    .get(date);
}

// ── Workout Templates ──

export function getWorkoutTemplates(): WorkoutTemplate[] {
  return getDb().prepare("SELECT * FROM workout_templates ORDER BY week_day").all() as WorkoutTemplate[];
}

export function getTemplateForDay(weekDay: number): WorkoutTemplate | null {
  return (getDb().prepare("SELECT * FROM workout_templates WHERE week_day = ?").get(weekDay) as WorkoutTemplate | undefined) ?? null;
}

export function getTemplateExercises(templateId: string): TemplateExercise[] {
  return getDb()
    .prepare("SELECT * FROM template_exercises WHERE template_id = ? ORDER BY order_idx")
    .all(templateId) as TemplateExercise[];
}

// ── Workout Sessions ──

export function getWorkoutSessions(limit = 30): WorkoutSession[] {
  return getDb()
    .prepare("SELECT * FROM workout_sessions ORDER BY date DESC, created_at DESC LIMIT ?")
    .all(limit) as WorkoutSession[];
}

export function getSessionForDate(date: string): WorkoutSession | null {
  return (getDb()
    .prepare("SELECT * FROM workout_sessions WHERE date = ? ORDER BY created_at DESC LIMIT 1")
    .get(date) as WorkoutSession | undefined) ?? null;
}

export function createWorkoutSession(data: Omit<WorkoutSession, "id" | "created_at">): WorkoutSession {
  const db = getDb();
  const session: WorkoutSession = { id: uuidv4(), ...data, created_at: new Date().toISOString() };
  db.prepare(
    `INSERT INTO workout_sessions (id, date, template_id, name, duration_min, cardio_done, cardio_min, notes, created_at)
     VALUES (@id, @date, @template_id, @name, @duration_min, @cardio_done, @cardio_min, @notes, @created_at)`
  ).run({
    ...session,
    template_id: session.template_id ?? null,
    duration_min: session.duration_min ?? null,
    cardio_min: session.cardio_min ?? null,
    notes: session.notes ?? null,
  });
  return session;
}

export function updateWorkoutSession(id: string, data: Partial<Omit<WorkoutSession, "id" | "created_at">>): WorkoutSession | null {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM workout_sessions WHERE id = ?").get(id) as WorkoutSession | undefined;
  if (!existing) return null;
  const merged = { ...existing, ...data };
  db.prepare(
    `UPDATE workout_sessions SET date=@date, template_id=@template_id, name=@name,
     duration_min=@duration_min, cardio_done=@cardio_done, cardio_min=@cardio_min, notes=@notes
     WHERE id=@id`
  ).run({
    ...merged,
    template_id: merged.template_id ?? null,
    duration_min: merged.duration_min ?? null,
    cardio_min: merged.cardio_min ?? null,
    notes: merged.notes ?? null,
  });
  return merged;
}

export function deleteWorkoutSession(id: string): boolean {
  return getDb().prepare("DELETE FROM workout_sessions WHERE id = ?").run(id).changes > 0;
}

// ── Session Exercises ──

export function getSessionExercises(sessionId: string): SessionExercise[] {
  return getDb()
    .prepare("SELECT * FROM session_exercises WHERE session_id = ? ORDER BY order_idx")
    .all(sessionId) as SessionExercise[];
}

export function upsertSessionExercise(data: Omit<SessionExercise, "id"> & { id?: string }): SessionExercise {
  const db = getDb();
  const id = data.id ?? uuidv4();
  const existing = data.id ? db.prepare("SELECT id FROM session_exercises WHERE id = ?").get(data.id) : null;
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
  if (existing) {
    db.prepare(
      `UPDATE session_exercises SET sets_data=@sets_data, notes=@notes WHERE id=@id`
    ).run(row);
  } else {
    db.prepare(
      `INSERT INTO session_exercises (id, session_id, template_exercise_id, name, sets_prescribed, reps_prescribed, sets_data, order_idx, notes)
       VALUES (@id, @session_id, @template_exercise_id, @name, @sets_prescribed, @reps_prescribed, @sets_data, @order_idx, @notes)`
    ).run(row);
  }
  return { ...data, id } as SessionExercise;
}

// ── Water Logs ──

export function getWaterLogForDate(date: string): WaterLog[] {
  return getDb().prepare("SELECT * FROM water_logs WHERE date = ? ORDER BY created_at").all(date) as WaterLog[];
}

export function getTotalWaterForDate(date: string): number {
  const result = getDb()
    .prepare("SELECT COALESCE(SUM(amount_ml), 0) as total FROM water_logs WHERE date = ?")
    .get(date) as { total: number };
  return result.total;
}

export function addWaterLog(date: string, amount_ml: number): WaterLog {
  const db = getDb();
  const entry: WaterLog = { id: uuidv4(), date, amount_ml, created_at: new Date().toISOString() };
  db.prepare("INSERT INTO water_logs (id, date, amount_ml, created_at) VALUES (@id, @date, @amount_ml, @created_at)").run(entry);
  return entry;
}

export function deleteWaterLog(id: string): boolean {
  return getDb().prepare("DELETE FROM water_logs WHERE id = ?").run(id).changes > 0;
}

export function resetWaterForDate(date: string): void {
  getDb().prepare("DELETE FROM water_logs WHERE date = ?").run(date);
}

// ── Supplements ──

export function getSupplements(activeOnly = false): Supplement[] {
  const database = getDb();
  if (activeOnly) {
    return database
      .prepare("SELECT * FROM supplements WHERE active = 1 ORDER BY category, name")
      .all() as Supplement[];
  }
  return database
    .prepare("SELECT * FROM supplements ORDER BY category, name")
    .all() as Supplement[];
}

export function createSupplement(data: Omit<Supplement, "id" | "created_at">): Supplement {
  const database = getDb();
  const entry: Supplement = { id: uuidv4(), ...data, created_at: new Date().toISOString() };
  database
    .prepare(
      `INSERT INTO supplements (id, name, brand, dose, category, timing, frequency, notes, active, created_at)
       VALUES (@id, @name, @brand, @dose, @category, @timing, @frequency, @notes, @active, @created_at)`
    )
    .run({ ...entry, frequency: entry.frequency ?? "daily" });
  return entry;
}

export function updateSupplement(id: string, data: Partial<Omit<Supplement, "id" | "created_at">>): Supplement | null {
  const database = getDb();
  const existing = database.prepare("SELECT * FROM supplements WHERE id = ?").get(id) as Supplement | undefined;
  if (!existing) return null;
  const updated = { ...existing, ...data };
  database
    .prepare(
      `UPDATE supplements SET name=@name, brand=@brand, dose=@dose, category=@category,
       timing=@timing, frequency=@frequency, notes=@notes, active=@active WHERE id=@id`
    )
    .run({ ...updated, frequency: updated.frequency ?? "daily" });
  return updated;
}

export function deleteSupplement(id: string): boolean {
  const database = getDb();
  const result = database.prepare("DELETE FROM supplements WHERE id = ?").run(id);
  return result.changes > 0;
}

// ── Supplement Intakes ──

export function getSupplementIntakesForDate(date: string): SupplementIntake[] {
  return getDb()
    .prepare("SELECT * FROM supplement_intakes WHERE date = ?")
    .all(date) as SupplementIntake[];
}

export function toggleSupplementIntake(
  date: string,
  supplementId: string,
  taken: boolean
): SupplementIntake | null {
  const db = getDb();
  const existing = db
    .prepare("SELECT * FROM supplement_intakes WHERE date = ? AND supplement_id = ?")
    .get(date, supplementId) as SupplementIntake | undefined;

  if (taken) {
    if (existing) {
      db.prepare("UPDATE supplement_intakes SET taken = 1 WHERE id = ?").run(existing.id);
      return { ...existing, taken: 1 };
    }
    const entry: SupplementIntake = {
      id: uuidv4(),
      date,
      supplement_id: supplementId,
      taken: 1,
      created_at: new Date().toISOString(),
    };
    db.prepare(
      `INSERT INTO supplement_intakes (id, date, supplement_id, taken, created_at)
       VALUES (@id, @date, @supplement_id, @taken, @created_at)`
    ).run(entry);
    return entry;
  }

  if (existing) {
    db.prepare("DELETE FROM supplement_intakes WHERE id = ?").run(existing.id);
  }
  return null;
}

export function markAllSupplementsForDate(date: string, supplementIds: string[]): void {
  const db = getDb();
  const insert = db.prepare(
    `INSERT OR IGNORE INTO supplement_intakes (id, date, supplement_id, taken, created_at)
     VALUES (@id, @date, @supplement_id, 1, @created_at)`
  );
  const now = new Date().toISOString();
  for (const supplementId of supplementIds) {
    insert.run({ id: uuidv4(), date, supplement_id: supplementId, created_at: now });
  }
}

export function getSupplementIntakeHistory(days = 14) {
  const db = getDb();
  const activeCount = (db.prepare("SELECT COUNT(*) as c FROM supplements WHERE active = 1").get() as { c: number }).c;

  const rows = db
    .prepare(
      `SELECT date, COUNT(*) as taken
       FROM supplement_intakes
       WHERE taken = 1
       GROUP BY date
       ORDER BY date DESC
       LIMIT ?`
    )
    .all(days) as { date: string; taken: number }[];

  return rows.map((r) => ({
    date: r.date,
    taken: r.taken,
    total: activeCount,
    pct: activeCount > 0 ? Math.round((r.taken / activeCount) * 100) : 0,
  }));
}

// ── User Profile ──

export function getUserProfile(): UserProfile | null {
  const database = getDb();
  return (database.prepare("SELECT * FROM user_profile WHERE id = 'me'").get() as UserProfile | undefined) ?? null;
}

export function upsertUserProfile(data: Partial<Omit<UserProfile, "id" | "updated_at">>): UserProfile {
  const database = getDb();
  const existing = getUserProfile();
  const now = new Date().toISOString();
  if (existing) {
    const updated = { ...existing, ...data, updated_at: now };
    database
      .prepare(
        `UPDATE user_profile SET name=@name, age=@age, height=@height, goal=@goal,
         avatar_filename=@avatar_filename, target_calories=@target_calories,
         target_protein=@target_protein, target_fat=@target_fat, target_carbs=@target_carbs,
         notes=@notes, updated_at=@updated_at WHERE id='me'`
      )
      .run(updated);
    return updated;
  }
  const profile: UserProfile = { id: "me", ...data, updated_at: now } as UserProfile;
  database
    .prepare(
      `INSERT INTO user_profile (id, name, age, height, goal, avatar_filename,
       target_calories, target_protein, target_fat, target_carbs, notes, updated_at)
       VALUES (@id, @name, @age, @height, @goal, @avatar_filename,
       @target_calories, @target_protein, @target_fat, @target_carbs, @notes, @updated_at)`
    )
    .run(profile);
  return profile;
}
