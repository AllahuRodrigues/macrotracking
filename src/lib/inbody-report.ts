/** Official InBody 580 scan — 06/09/2026, 19:50 (latest) */

export const INBODY_SCAN_DATE = "2026-06-09";

export const INBODY_REPORT = {
  meta: {
    testDate: "2026-06-09",
    testTime: "19:50",
    device: "InBody580 / 5668",
    height: "5 ft 06.5 in",
    age: 23,
    sex: "Male",
    score: 90,
  },

  bodyComposition: {
    weightLb: 187.6,
    totalBodyWaterLb: 110.0,
    intracellularWaterLb: 69.9,
    extracellularWaterLb: 40.1,
    dryLeanMassLb: 40.3,
    bodyFatMassLb: 37.3,
    fatFreeMassLb: 150.4,
  },

  muscleFatAnalysis: {
    weightLb: 187.6,
    skeletalMuscleMassLb: 86.9,
    bodyFatMassLb: 37.3,
    classification: "Above Average D-Type",
    classificationNote:
      "Weight and skeletal muscle mass above healthy range; body fat elevated but trending down (-4 lb since May 22).",
  },

  obesityAnalysis: {
    bmi: 29.8,
    /** InBody 580 bioimpedance reading */
    percentBodyFat: 19.9,
    percentBodyFatOfficial: 19.9,
    /** User-reported (separate method — scale/visual) */
    percentBodyFatUserReported: 30,
    bodyFatMassLb: 37.3,
    visceralFatAreaCm2: 68.2,
    visceralFatLevel: 6,
    visceralFatIn2: 0,
    visceralFatLevelApp: 6,
  },

  segmentalLean: [
    { part: "Trunk", massLb: 65.4, ratingPct: 113.9, label: "above average" },
    { part: "Left Arm", massLb: 8.82, ratingPct: 122.3, label: "above average" },
    { part: "Right Arm", massLb: 8.62, ratingPct: 119.8, label: "above average" },
    { part: "Left Leg", massLb: 20.86, ratingPct: 104.1, label: "average" },
    { part: "Right Leg", massLb: 20.68, ratingPct: 103.2, label: "average" },
  ],

  segmentalFat: [
    { part: "Trunk", massLb: 20.7, ratingPct: 237.3, high: true },
    { part: "Left Arm", massLb: 2.0, ratingPct: 150.9, high: false },
    { part: "Right Arm", massLb: 2.0, ratingPct: 153.7, high: false },
    { part: "Left Leg", massLb: 5.1, ratingPct: 139.8, high: false },
    { part: "Right Leg", massLb: 4.9, ratingPct: 138.8, high: false },
  ],

  ecwTbw: {
    segmental: [
      { part: "Trunk", ratio: 0.362 },
      { part: "Left Arm", ratio: 0.375 },
      { part: "Right Arm", ratio: 0.373 },
      { part: "Left Leg", ratio: 0.361 },
      { part: "Right Leg", ratio: 0.362 },
    ],
    totalRatio: 0.364,
    totalBodyWaterL: 49.9,
    intracellularWaterL: 31.7,
    extracellularWaterL: 18.2,
    note: "Water balance excellent. ECW/TBW 0.364 — normal. Total body water +1.9 L vs May 22 (muscle gain signal).",
  },

  comprehensive: {
    bmrKcal: 1843,
    bmrKj: 7711,
    bmrAppEstimate: 1843,
    maintenanceEstimate: "2,600–3,200 kcal/day",
    legLeanMassLb: 41.5,
    phaseAngle: 7.5,
    phaseAngleApp: 7.5,
    armCircumferenceIn: 14.2,
    tbwFfmPct: 73.2,
    ffmi: 23.9,
    smmWtPct: 46.3,
  },

  bodyBalance: {
    upperBody: "Balanced",
    lowerBody: "Balanced",
    upperLower: "Slightly Unbalanced",
    note: "Upper/lower slightly unbalanced — legs catching up (+1.4 lb lean each vs May 22). Continue leg days.",
  },

  control: {
    suggestedFatLossLb: 10.8,
    suggestedLeanGainLb: 0.0,
    targetWeightLb: 174,
    targetBodyFatPct: "14–16%",
    startWeightLb: 187.6,
    goalNote:
      "Lose fat while preserving 86.9 lb muscle. Target: ~174 lb @ 14–16% BF by Aug 1. User-reported BF 30% — trunk fat is primary target.",
  },

  summary: {
    headline: "Score 90 — muscle up, fat down. Cut is working.",
    bullets: [
      "SMM +1.8 lb vs May 22 (85.1 → 86.9) — gaining muscle while cutting.",
      "InBody BF 19.9% (37.3 lb). User-reported BF 30% from separate measurement.",
      "Visceral fat dropped: 75.1 → 68.2 cm² (-8.1 cm²), level 7 → 6.",
      "Phase angle improved to 7.5° — cell quality trending up.",
      "Cut focus: trunk fat reduction. Preserve arm/leg muscle already above average.",
    ],
  },

  bioAge: {
    strengthBioAge: 27,
    upperBodyStrengthAge: 21,
    lowerBodyStrengthAge: 34,
    egymChestPressLb: 207,
    egymShoulderPressLb: 227,
    egymLatPulldownLb: 324,
    egymSeatedRowLb: 309,
    egymLegExtensionLb: 271,
    egymLegPressLb: 377,
    egymLegCurlLb: 187,
    egymActivityPoints: 1066,
    egymRanking: "32nd / top 10%",
    appView: {
      bmi: 29.8,
      weightLb: 187.6,
      bodyFatLb: 37.3,
      bodyFatPct: 19.9,
      skeletalMuscleMassLb: 86.9,
      fatFreeMassLb: 150.4,
      phaseAngle: 7.5,
    },
  },
} as const;

/** Map to body_metrics row for DB sync */
export function inbodyToBodyMetric(date = INBODY_SCAN_DATE) {
  const r = INBODY_REPORT;
  return {
    date,
    weight_lbs: r.bodyComposition.weightLb,
    body_fat_pct: r.obesityAnalysis.percentBodyFatOfficial,
    muscle_mass_lbs: r.bioAge.appView.skeletalMuscleMassLb,
    skeletal_muscle_lbs: r.muscleFatAnalysis.skeletalMuscleMassLb,
    bmi: r.obesityAnalysis.bmi,
    visceral_fat: r.obesityAnalysis.visceralFatAreaCm2,
    inbody_score: r.meta.score,
    body_water_pct: r.comprehensive.tbwFfmPct,
    bmr: r.comprehensive.bmrKcal,
    notes: `InBody 580 — ${date} ${r.meta.testTime}. Score ${r.meta.score}. Phase angle ${r.comprehensive.phaseAngle}°. FFMI ${r.comprehensive.ffmi}. SMM ${r.muscleFatAnalysis.skeletalMuscleMassLb} lb. BF ${r.obesityAnalysis.bodyFatMassLb} lb (${r.obesityAnalysis.percentBodyFatOfficial}%). VFA ${r.obesityAnalysis.visceralFatAreaCm2} cm². Target: -${r.control.suggestedFatLossLb} lb fat → ~${r.control.targetWeightLb} lb @ ${r.control.targetBodyFatPct} BF.`,
  };
}
