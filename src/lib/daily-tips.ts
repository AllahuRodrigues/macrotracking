/**
 * Interpretable "ML-lite" daily tips: scores tips from insights + plan day +
 * today's macros/check-in. Covers skin, hair, scent, blood flow, endurance, speed.
 */

import type { InsightsPayload } from "./insights";
import { planDayFor, planPhaseFor } from "./plan";

export type TipDomain =
  | "skin"
  | "hair"
  | "scent"
  | "circulation"
  | "endurance"
  | "speed"
  | "recovery"
  | "habits";

export type DailyTip = {
  id: string;
  domain: TipDomain;
  title: string;
  action: string;
  why: string;
  priority: "high" | "medium" | "low";
  score: number;
};

export type DailyTipsInput = {
  dateISO: string;
  insights?: InsightsPayload | null;
  todayProtein?: number | null;
  todayCalories?: number | null;
  todayWaterMl?: number | null;
  sleepHours?: number | null;
  stress?: number | null; // 1–5
  hunger?: number | null;
};

export const TIP_DOMAIN_LABEL: Record<TipDomain, string> = {
  skin: "Skin",
  hair: "Hair",
  scent: "Smell",
  circulation: "Blood flow",
  endurance: "Endurance",
  speed: "Speed",
  recovery: "Recovery",
  habits: "Habits",
};

type TipCandidate = Omit<DailyTip, "score"> & {
  /** Higher = more relevant today */
  base: number;
  boost?: (ctx: Ctx) => number;
};

type Ctx = {
  weekday: number;
  focus: string;
  dayTitle: string;
  isPush: boolean;
  isPull: boolean;
  isLegs: boolean;
  isRest: boolean;
  phaseRest: boolean;
  proteinLow: boolean;
  caloriesHigh: boolean;
  caloriesLow: boolean;
  waterLow: boolean;
  sleepLow: boolean;
  stressHigh: boolean;
  fatOvershoot: boolean;
  proteinHitWeak: boolean;
  weightStalling: boolean;
  cuttingHard: boolean;
};

function buildCtx(input: DailyTipsInput): Ctx {
  const d = new Date(input.dateISO + "T12:00:00");
  const weekday = d.getDay();
  const plan = planDayFor(weekday);
  const phase = planPhaseFor(input.dateISO);
  const focus = (plan.focus + " " + plan.title).toLowerCase();
  const insights = input.insights;

  const protein = input.todayProtein ?? 0;
  const cals = input.todayCalories ?? 0;
  const water = input.todayWaterMl ?? 0;
  const sleep = input.sleepHours ?? null;

  const weeklyRate = insights?.weight.weekly_rate_lbs ?? null;

  return {
    weekday,
    focus: plan.focus,
    dayTitle: plan.title,
    isPush: focus.includes("chest") || focus.includes("push") || focus.includes("shoulder"),
    isPull: focus.includes("back") || focus.includes("pull") || focus.includes("bicep"),
    isLegs: focus.includes("leg") || focus.includes("quad") || focus.includes("lower"),
    isRest: weekday === 0 || focus.includes("recover"),
    phaseRest: !!phase?.rest,
    proteinLow: protein > 0 && protein < 140,
    caloriesHigh: cals > 2600,
    caloriesLow: cals > 0 && cals < 1900,
    waterLow: water > 0 && water < 2000,
    sleepLow: sleep != null && sleep < 7,
    stressHigh: (input.stress ?? 0) >= 4,
    fatOvershoot: (insights?.adherence.fat_overshoot_rate_pct ?? 0) >= 40,
    proteinHitWeak: (insights?.adherence.protein_hit_rate_pct ?? 100) < 70,
    weightStalling: weeklyRate != null && weeklyRate > -0.2 && weeklyRate < 0.4,
    cuttingHard: weeklyRate != null && weeklyRate < -1.8,
  };
}

const CANDIDATES: TipCandidate[] = [
  // —— Skin ——
  {
    id: "skin_spf",
    domain: "skin",
    title: "SPF before you leave",
    action: "Cleanse → moisturizer → SPF 30+ on face/neck. Reapply if outside >2 h.",
    why: "UV is the #1 premature aging driver — glowmax is mostly sunscreen + sleep.",
    priority: "high",
    base: 8,
  },
  {
    id: "skin_sleep",
    domain: "skin",
    title: "Skin recovers in bed",
    action: "Protect a 7.5–9 h window tonight. Dim screens 45 min before sleep.",
    why: "Low sleep shows as dull skin and worse recovery hormones.",
    priority: "high",
    base: 4,
    boost: (c) => (c.sleepLow ? 10 : 0) + (c.stressHigh ? 3 : 0),
  },
  {
    id: "skin_water_salt",
    domain: "skin",
    title: "Face puff vs real fat",
    action: "Hit 3–4 L fluids. Keep salt steady — don't slash sodium for the mirror.",
    why: "Wild water/salt swings inflate the face overnight and fake 'bad' progress.",
    priority: "medium",
    base: 5,
    boost: (c) => (c.waterLow ? 6 : 0),
  },
  {
    id: "skin_pm",
    domain: "skin",
    title: "PM wash after sweat",
    action: "Tonight: gentle cleanse + moisturizer. No picking. Soft towel only.",
    why: "Training oil + SPF left on overnight clogs and dulls skin.",
    priority: "medium",
    base: 6,
    boost: (c) => (c.isRest ? -2 : 2),
  },

  // —— Hair ——
  {
    id: "hair_protein",
    domain: "hair",
    title: "Hair needs protein too",
    action: "Close the gap to 200g protein — shakes count. Don't starve the cut.",
    why: "Chronic low protein + crash deficits show up in hair quality over weeks.",
    priority: "high",
    base: 3,
    boost: (c) => (c.proteinLow || c.proteinHitWeak ? 9 : 0) + (c.caloriesLow ? 4 : 0),
  },
  {
    id: "hair_wash",
    domain: "hair",
    title: "Post-train scalp rinse",
    action: "After lifting: rinse sweat from scalp. Don't sleep in gym sweat.",
    why: "Sweat + oil on the scalp looks flat and can irritate the hairline.",
    priority: "medium",
    base: 5,
    boost: (c) => (c.isRest ? -3 : 3),
  },
  {
    id: "hair_gentle",
    domain: "hair",
    title: "Gentle hair day",
    action: "No tight hats all day. Pat dry — don't aggressive towel-rub wet hair.",
    why: "Mechanical breakage + traction at the hairline is avoidable damage.",
    priority: "low",
    base: 4,
  },

  // —— Smell ——
  {
    id: "scent_post",
    domain: "scent",
    title: "Smell clean after training",
    action: "Shower → fresh tee → antiperspirant → 1–2 sprays cologne max.",
    why: "Presence is half scent. Loud cologne reads try-hard; clean reads sharp.",
    priority: "high",
    base: 7,
    boost: (c) => (c.isRest ? -2 : 3),
  },
  {
    id: "scent_breath",
    domain: "scent",
    title: "Breath = close-range glow",
    action: "Floss today. Gum/mints after coffee. Tongue scrape this morning if you skipped.",
    why: "Gums + tongue beat spray. People notice breath before they notice your haircut.",
    priority: "high",
    base: 7,
  },
  {
    id: "scent_clothes",
    domain: "scent",
    title: "Fresh fabric check",
    action: "Don't rewear yesterday's tee. Gym bag out of the bedroom.",
    why: "Fabric holds odor even when you don't notice it anymore.",
    priority: "medium",
    base: 5,
  },

  // —— Circulation / sexual health (tasteful) ——
  {
    id: "circ_no_zyn",
    domain: "circulation",
    title: "Zero Zyns — vessels win",
    action: "No nicotine pouches today. Craving → water, gum, 5‑min walk.",
    why: "Nicotine constricts blood vessels — worse for blood flow, gums, sleep, and the cut.",
    priority: "high",
    base: 10,
  },
  {
    id: "circ_walk",
    domain: "circulation",
    title: "Post-meal blood-flow walk",
    action: "10–15 min easy walk after your biggest meal. Keep total steps 12–15k.",
    why: "Movement after eating helps glucose handling and all-day circulation.",
    priority: "high",
    base: 6,
    boost: (c) => (c.isRest || c.phaseRest ? 3 : 1),
  },
  {
    id: "circ_no_crash",
    domain: "circulation",
    title: "Don't crush calories",
    action: "Stay ≥ ~2,000 kcal. Hit protein. Under-eating nukes energy, mood, and libido signals.",
    why: "Aggressive deficits + nicotine + bad sleep is the worst stack for blood flow.",
    priority: "high",
    base: 4,
    boost: (c) => (c.caloriesLow || c.cuttingHard ? 8 : 0),
  },
  {
    id: "circ_sleep",
    domain: "circulation",
    title: "Sleep = hormonal recovery",
    action: "Same bedtime. Magnesium glycinate as planned. Cool, dark room.",
    why: "Sleep debt tanks recovery, skin, and vascular/sexual health markers.",
    priority: "medium",
    base: 5,
    boost: (c) => (c.sleepLow ? 7 : 0),
  },

  // —— Endurance ——
  {
    id: "end_zone2",
    domain: "endurance",
    title: "Zone 2 card for the engine",
    action: "After lifting (or as Sunday block): 25–40 min easy incline walk / bike — nose breathing if you can.",
    why: "Aerobic base supports fat loss, recovery between sets, and all-day energy.",
    priority: "high",
    base: 6,
    boost: (c) => (c.isRest ? 5 : c.isLegs ? 2 : 3),
  },
  {
    id: "end_carbs",
    domain: "endurance",
    title: "Carbs around work",
    action: "Dates/pre-fuel before training; rice/potato after. Don't go zero-carb on lift days.",
    why: "Carbs fuel quality volume — flat + weak is not 'more shredded.'",
    priority: "medium",
    base: 5,
    boost: (c) => (c.isRest ? -3 : 4) + (c.fatOvershoot ? 2 : 0),
  },
  {
    id: "end_water",
    domain: "endurance",
    title: "Hydration for output",
    action: "Front-load water before noon. Extra 500 mL if sauna or heavy sweat.",
    why: "Even mild dehydration cuts endurance and pumps.",
    priority: "medium",
    base: 5,
    boost: (c) => (c.waterLow ? 7 : 0),
  },

  // —— Speed ——
  {
    id: "speed_warmup",
    domain: "speed",
    title: "Asthma-safe speed warm-up",
    action: "10–12 min progressive warm-up before any accelerations. Inhaler if prescribed. Stop on wheeze.",
    why: "Quality speed needs a clean airway — never sprint cold.",
    priority: "high",
    base: 2,
    boost: (c) => (c.isLegs ? 12 : -5),
  },
  {
    id: "speed_quality",
    domain: "speed",
    title: "Speed = quality, not conditioning",
    action: "If doing accelerations/shuttles: full recovery (90–150 s). Fast and clean — not gasping repeats.",
    why: "Turning speed work into HIIT wrecks power and raises injury risk.",
    priority: "high",
    base: 2,
    boost: (c) => (c.isLegs ? 10 : -5),
  },
  {
    id: "speed_skip",
    domain: "speed",
    title: "No max sprints today",
    action: "Push/Pull day: skip all-out speed. Optional easy strides only if legs feel fresh.",
    why: "Upper days already tax the nervous system — save quality speed for Legs.",
    priority: "medium",
    base: 3,
    boost: (c) => (c.isPush || c.isPull ? 6 : -4),
  },

  // —— Recovery / habits ——
  {
    id: "rec_pushups",
    domain: "recovery",
    title: "Push-up ritual (dose it)",
    action:
      "AM: 3–5 sets clean push-ups. If Push day already: keep evening sets easy (2× submaximal).",
    why: "Daily pressing builds work capacity without replacing your Push session.",
    priority: "medium",
    base: 6,
    boost: (c) => (c.isPush ? -2 : 2),
  },
  {
    id: "hab_steps",
    domain: "habits",
    title: "Steps still count",
    action: "12–15k even on Rest/Reset. Easy walking is fat-loss insurance.",
    why: "When the scale stalls, steps + protein usually fix it before more cardio volume.",
    priority: "high",
    base: 5,
    boost: (c) => (c.weightStalling ? 6 : 0) + (c.isRest || c.phaseRest ? 4 : 0),
  },
  {
    id: "hab_fat",
    domain: "habits",
    title: "Tighten the easy fats",
    action: "Measure oils/sauces today. Keep protein high — cut accidental fat calories first.",
    why: "Your logging shows fat overshoots often steal the deficit.",
    priority: "high",
    base: 2,
    boost: (c) => (c.fatOvershoot || c.caloriesHigh ? 9 : 0),
  },
];

export function buildDailyTips(input: DailyTipsInput, limit = 8): DailyTip[] {
  const ctx = buildCtx(input);
  const scored: DailyTip[] = CANDIDATES.map((t) => {
    const score = t.base + (t.boost?.(ctx) ?? 0);
    return {
      id: t.id,
      domain: t.domain,
      title: t.title,
      action: t.action,
      why: t.why,
      priority: score >= 12 ? "high" : score >= 7 ? "medium" : t.priority,
      score,
    };
  });

  // Ensure coverage: at least one from key domains if possible
  const want: TipDomain[] = ["circulation", "skin", "scent", "endurance"];
  if (ctx.isLegs) want.unshift("speed");
  if (ctx.proteinLow || ctx.proteinHitWeak) want.unshift("hair");

  const picked: DailyTip[] = [];
  const used = new Set<string>();

  for (const domain of want) {
    const best = scored
      .filter((t) => t.domain === domain && !used.has(t.id))
      .sort((a, b) => b.score - a.score)[0];
    if (best && best.score >= 4) {
      picked.push(best);
      used.add(best.id);
    }
  }

  for (const t of scored.sort((a, b) => b.score - a.score)) {
    if (picked.length >= limit) break;
    if (used.has(t.id)) continue;
    if (t.score < 5) continue;
    picked.push(t);
    used.add(t.id);
  }

  return picked.slice(0, limit);
}

export type DailyTipsPayload = {
  date: string;
  day_label: string;
  focus: string;
  tips: DailyTip[];
};

export function buildDailyTipsPayload(input: DailyTipsInput, limit = 8): DailyTipsPayload {
  const d = new Date(input.dateISO + "T12:00:00");
  const plan = planDayFor(d.getDay());
  return {
    date: input.dateISO,
    day_label: plan.title,
    focus: plan.focus,
    tips: buildDailyTips(input, limit),
  };
}
