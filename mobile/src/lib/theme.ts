/** Dark theme matching the MacroTrack web palette. */
export const theme = {
  colors: {
    background: "#0b0f0e",
    card: "#141a18",
    cardBorder: "#232b28",
    foreground: "#e8f0ec",
    muted: "#8a978f",
    accent: "#4ade80", // green — training / positive
    accentWarm: "#fb923c", // orange — cardio / warnings
    blue: "#60a5fa", // water
    red: "#f87171",
    protein: "#f472b6",
    carbs: "#fbbf24",
    fat: "#a78bfa",
    calories: "#4ade80",
  },
  radius: { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 },
  spacing: (n: number) => n * 4,
} as const;

export type Theme = typeof theme;

export const MACRO_COLOR = {
  calories: theme.colors.calories,
  protein: theme.colors.protein,
  carbs: theme.colors.carbs,
  fat: theme.colors.fat,
} as const;
