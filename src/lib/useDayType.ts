"use client";

import { useState, useCallback, useEffect } from "react";
import type { DayType, MacroGoals } from "./types";
import { WORKOUT_DAY_GOALS, REST_DAY_GOALS, DEFAULT_GOALS } from "./types";

const STORAGE_KEY = "dayType";

function readStorage(): DayType | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === "workout" || v === "rest") return v;
  return null;
}

export function useDayType() {
  // Always null on first render (server + client) to avoid hydration mismatch
  const [dayType, setDayTypeState] = useState<DayType | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDayTypeState(readStorage());
    setReady(true);
  }, []);

  const setDayType = useCallback((t: DayType | null) => {
    setDayTypeState(t);
    if (typeof window !== "undefined") {
      if (t) localStorage.setItem(STORAGE_KEY, t);
      else localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const goals: MacroGoals =
    dayType === "workout"
      ? WORKOUT_DAY_GOALS
      : dayType === "rest"
      ? REST_DAY_GOALS
      : DEFAULT_GOALS;

  return { dayType, setDayType, goals, ready };
}
