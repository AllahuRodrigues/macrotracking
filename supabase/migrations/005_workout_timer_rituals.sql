-- Workout session timer fields (pause / resume / finish)
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS started_at timestamptz;
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS ended_at timestamptz;
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS paused_total_ms integer DEFAULT 0;
ALTER TABLE workout_sessions ADD COLUMN IF NOT EXISTS pause_started_at timestamptz;

-- Ritual daily completions (sync web ↔ phone)
CREATE TABLE IF NOT EXISTS ritual_completions (
  date text NOT NULL,
  ritual_id text NOT NULL,
  done integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (date, ritual_id)
);

ALTER TABLE ritual_completions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_ritual_completions" ON ritual_completions;
CREATE POLICY "anon_all_ritual_completions" ON ritual_completions FOR ALL USING (true) WITH CHECK (true);
