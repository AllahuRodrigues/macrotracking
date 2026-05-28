export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface FoodEntry {
  id: string;
  date: string;
  meal_type: MealType;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  notes?: string;
  created_at: string;
}

export interface BodyMetric {
  id: string;
  date: string;
  weight_lbs?: number;
  body_fat_pct?: number;
  muscle_mass_lbs?: number;
  skeletal_muscle_lbs?: number;
  bmi?: number;
  visceral_fat?: number;
  inbody_score?: number;
  body_water_pct?: number;
  bmr?: number;
  notes?: string;
  created_at: string;
}

export type PhotoCategory = "meal" | "body" | "progress";

export interface PhotoEntry {
  id: string;
  date: string;
  category: PhotoCategory;
  filename: string;
  caption?: string;
  created_at: string;
}

export interface DailyMacroSummary {
  date: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  entry_count: number;
}

export interface MacroGoals {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export const DEFAULT_GOALS: MacroGoals = {
  calories: 2250,
  protein: 200,
  fat: 61,
  carbs: 200,
};

export const WORKOUT_DAY_GOALS: MacroGoals = {
  calories: 2300,
  protein: 200,
  fat: 57,
  carbs: 220,
};

export const REST_DAY_GOALS: MacroGoals = {
  calories: 2150,
  protein: 200,
  fat: 70,
  carbs: 165,
};

export type DayType = "workout" | "rest";

export type SupplementCategory =
  | "vitamin"
  | "mineral"
  | "amino_acid"
  | "performance"
  | "omega"
  | "herb"
  | "protein"
  | "other";

export type SupplementFrequency = "daily" | "every_2_days" | "weekly";

export interface Supplement {
  id: string;
  name: string;
  brand?: string;
  dose?: string;
  category: SupplementCategory;
  timing?: string;
  frequency?: SupplementFrequency;
  notes?: string;
  active: number;
  created_at: string;
}

export interface SupplementIntake {
  id: string;
  date: string;
  supplement_id: string;
  taken: number; // 0 | 1
  created_at: string;
}

export interface SupplementDaySummary {
  date: string;
  taken: number;
  total: number;
  pct: number;
}

export interface UserProfile {
  id: string;
  name?: string;
  age?: number;
  height?: string;
  goal?: string;
  avatar_filename?: string;
  target_calories?: number;
  target_protein?: number;
  target_fat?: number;
  target_carbs?: number;
  notes?: string;
  updated_at: string;
}

export interface InBodySegment {
  trunk_lean: number;
  left_arm_lean: number;
  right_arm_lean: number;
  left_leg_lean: number;
  right_leg_lean: number;
  trunk_fat: number;
  left_arm_fat: number;
  right_arm_fat: number;
  left_leg_fat: number;
  right_leg_fat: number;
}

// ── Workout Types ──

export interface WorkoutTemplate {
  id: string;
  week_day: number; // 0=Sun 1=Mon … 6=Sat
  day_name: string; // "Pull A"
  label: string;    // "Monday — Pull A: Back Width + Biceps"
  muscle_groups: string;
  goal: string;
  cardio: string;
  created_at: string;
}

export interface TemplateExercise {
  id: string;
  template_id: string;
  name: string;
  sets_prescribed: string;
  reps_prescribed: string;
  order_idx: number;
  notes?: string;
}

export interface SessionSet {
  set_num: number;
  weight_lbs?: number;
  reps?: number;
  done: boolean;
}

export interface SessionExercise {
  id: string;
  session_id: string;
  template_exercise_id?: string;
  name: string;
  sets_prescribed: string;
  reps_prescribed: string;
  sets_data: string; // JSON SessionSet[]
  order_idx: number;
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  date: string;
  template_id?: string;
  name: string;
  duration_min?: number;
  cardio_done: number; // 0|1
  cardio_min?: number;
  notes?: string;
  created_at: string;
}

export interface WaterLog {
  id: string;
  date: string;
  amount_ml: number;
  created_at: string;
}

export const WATER_GOAL_ML = 4000;

export interface BodyMetricExtended extends BodyMetric {
  segmental?: InBodySegment;
  phase_angle?: number;
  ffmi?: number;
  ecw_tbw?: number;
  dry_lean_mass?: number;
  fat_free_mass?: number;
}
