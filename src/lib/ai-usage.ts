import { getSupabase, useSupabase } from "./supabase-client";
import { todayISO } from "./timezone";

/**
 * Daily hard spend cap so AI food analysis can never blow past ~$1/day.
 * Override with AI_DAILY_BUDGET_USD.
 */
export const AI_DAILY_BUDGET_USD = parseFloat(
  process.env.AI_DAILY_BUDGET_USD ?? "1.0"
);

// In-process fallback if the ai_usage table isn't present yet.
const memory: Record<string, number> = {};

export type UsageState = { date: string; spent_usd: number; requests: number };

export async function getUsageToday(): Promise<UsageState> {
  const date = todayISO();
  if (!useSupabase()) {
    return { date, spent_usd: memory[date] ?? 0, requests: 0 };
  }
  try {
    const sb = getSupabase();
    const { data } = await sb
      .from("ai_usage")
      .select("date, spent_usd, requests")
      .eq("date", date)
      .maybeSingle();
    return {
      date,
      spent_usd: data?.spent_usd ?? memory[date] ?? 0,
      requests: data?.requests ?? 0,
    };
  } catch {
    return { date, spent_usd: memory[date] ?? 0, requests: 0 };
  }
}

export async function recordUsage(costUsd: number): Promise<void> {
  const date = todayISO();
  memory[date] = (memory[date] ?? 0) + costUsd;
  if (!useSupabase()) return;
  try {
    const sb = getSupabase();
    const { data } = await sb
      .from("ai_usage")
      .select("spent_usd, requests")
      .eq("date", date)
      .maybeSingle();
    if (data) {
      await sb
        .from("ai_usage")
        .update({
          spent_usd: (data.spent_usd ?? 0) + costUsd,
          requests: (data.requests ?? 0) + 1,
        })
        .eq("date", date);
    } else {
      await sb.from("ai_usage").insert({ date, spent_usd: costUsd, requests: 1 });
    }
  } catch {
    // table missing — memory cap still applies for this process
  }
}

/** True if we still have budget left for another call today. */
export async function hasBudget(): Promise<boolean> {
  const { spent_usd } = await getUsageToday();
  return spent_usd < AI_DAILY_BUDGET_USD;
}
