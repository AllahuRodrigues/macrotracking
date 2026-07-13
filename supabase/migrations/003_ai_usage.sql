-- AI food-analysis daily spend tracking (guards the <$1/day budget).
-- Run in the Supabase SQL editor.
CREATE TABLE IF NOT EXISTS ai_usage (
  date TEXT PRIMARY KEY,
  spent_usd DOUBLE PRECISION NOT NULL DEFAULT 0,
  requests INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
