"use client";

import { useState, useCallback } from "react";
import type { DayType, MacroGoals } from "./types";
import { WORKOUT_DAY_GOALS, REST_DAY_GOALS, DEFAULT_GOALS } from "./types";

function readStorage(): DayType | null {
  if (typeof window === "undefined") return null;
  return (localStorage.getItem("dayType") as DayType) ?? null;
}

export function useDayType() {
  const [dayType, setDayTypeState] = useState<DayType | null>(() => readStorage());

  const setDayType = useCallback((t: DayType | null) => {
    setDayTypeState(t);
    if (typeof window !== "undefined") {
      if (t) localStorage.setItem("dayType", t);
      else localStorage.removeItem("dayType");
    }
  }, []);

  const goals: MacroGoals =
    dayType === "workout"
      ? WORKOUT_DAY_GOALS
      : dayType === "rest"
      ? REST_DAY_GOALS
      : DEFAULT_GOALS;

  return { dayType, setDayType, goals };
}
