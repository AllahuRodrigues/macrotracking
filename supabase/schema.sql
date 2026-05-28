-- Macro Tracking — PostgreSQL schema (mirrors SQLite db-sqlite.ts)

CREATE TABLE IF NOT EXISTS food_entries (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  name TEXT NOT NULL,
  calories DOUBLE PRECISION NOT NULL DEFAULT 0,
  protein DOUBLE PRECISION NOT NULL DEFAULT 0,
  fat DOUBLE PRECISION NOT NULL DEFAULT 0,
  carbs DOUBLE PRECISION NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS body_metrics (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  weight_lbs DOUBLE PRECISION,
  body_fat_pct DOUBLE PRECISION,
  muscle_mass_lbs DOUBLE PRECISION,
  skeletal_muscle_lbs DOUBLE PRECISION,
  bmi DOUBLE PRECISION,
  visceral_fat DOUBLE PRECISION,
  inbody_score DOUBLE PRECISION,
  body_water_pct DOUBLE PRECISION,
  bmr DOUBLE PRECISION,
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
  tracks_macros INTEGER DEFAULT 0,
  macro_calories DOUBLE PRECISION DEFAULT 0,
  macro_protein DOUBLE PRECISION DEFAULT 0,
  macro_fat DOUBLE PRECISION DEFAULT 0,
  macro_carbs DOUBLE PRECISION DEFAULT 0,
  allows_quantity INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS supplement_intakes (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  supplement_id TEXT NOT NULL,
  taken INTEGER NOT NULL DEFAULT 1,
  quantity INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  UNIQUE(date, supplement_id)
);

CREATE TABLE IF NOT EXISTS user_profile (
  id TEXT NOT NULL DEFAULT 'me' PRIMARY KEY,
  name TEXT,
  age INTEGER,
  height TEXT,
  ethnicity TEXT,
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
CREATE INDEX IF NOT EXISTS idx_supplement_intakes_date ON supplement_intakes(date);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON workout_sessions(date);
CREATE INDEX IF NOT EXISTS idx_water_logs_date ON water_logs(date);
CREATE INDEX IF NOT EXISTS idx_template_exercises_template ON template_exercises(template_id);
CREATE INDEX IF NOT EXISTS idx_session_exercises_session ON session_exercises(session_id);

-- ── Storage bucket for photos & avatars ──
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'uploads');

CREATE POLICY "Service role upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Service role update uploads"
ON storage.objects FOR UPDATE
USING (bucket_id = 'uploads');

CREATE POLICY "Service role delete uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'uploads');
