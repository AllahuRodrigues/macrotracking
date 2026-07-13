-- Daily recovery / lifestyle check-in (sleep, steps, subjective scores).
CREATE TABLE IF NOT EXISTS daily_checkins (
  date TEXT PRIMARY KEY,
  sleep_hours DOUBLE PRECISION,
  sleep_quality INTEGER,
  steps INTEGER,
  resting_hr INTEGER,
  hrv INTEGER,
  hunger INTEGER,
  stress INTEGER,
  bloating INTEGER,
  soreness INTEGER,
  motivation INTEGER,
  session_rpe INTEGER,
  caffeine_mg INTEGER,
  alcohol INTEGER DEFAULT 0,
  notes TEXT,
  source TEXT DEFAULT 'manual',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
