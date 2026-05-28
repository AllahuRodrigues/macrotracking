/** Official InBody 580 scan — 05/22/2026, 11:57 */

export const INBODY_SCAN_DATE = "2026-05-22";

export const INBODY_REPORT = {
  meta: {
    testDate: "2026-05-22",
    testTime: "11:57",
    device: "InBody / InBody580",
    height: "5 ft 06.5 in",
    age: 23,
    sex: "Male",
    score: 88,
  },

  bodyComposition: {
    weightLb: 189.6,
    totalBodyWaterLb: 108.2,
    intracellularWaterLb: 68.6,
    extracellularWaterLb: 39.7,
    dryLeanMassLb: 39.7,
    bodyFatMassLb: 39.0,
    fatFreeMassLb: 147.9,
  },

  muscleFatAnalysis: {
    weightLb: 186.9,
    skeletalMuscleMassLb: 85.1,
    bodyFatMassLb: 39.0,
    classification: "Above Average D-Type",
    classificationNote:
      "Weight and skeletal muscle mass are above healthy range; body fat mass is also elevated.",
  },

  obesityAnalysis: {
    bmi: 29.7,
    percentBodyFat: 24.9,
    percentBodyFatOfficial: 20.9,
    bodyFatMassLb: 39.0,
    visceralFatAreaCm2: 75.1,
    visceralFatLevel: 7,
    visceralFatIn2: 13,
    visceralFatLevelApp: 8,
  },

  segmentalLean: [
    { part: "Trunk", massLb: 65.3, ratingPct: 113.8, label: "above average" },
    { part: "Left Arm", massLb: 8.82, ratingPct: 122.7, label: "above average" },
    { part: "Right Arm", massLb: 8.58, ratingPct: 119.3, label: "above average" },
    { part: "Left Leg", massLb: 19.91, ratingPct: 99.5, label: "average" },
    { part: "Right Leg", massLb: 19.97, ratingPct: 99.8, label: "average" },
  ],

  segmentalFat: [
    { part: "Trunk", massLb: 22.0, ratingPct: 252.2, high: true },
    { part: "Left Arm", massLb: 2.0, ratingPct: 167.2, high: true },
    { part: "Right Arm", massLb: 2.2, ratingPct: 171.6, high: true },
    { part: "Left Leg", massLb: 5.1, ratingPct: 139.6, high: false },
    { part: "Right Leg", massLb: 4.9, ratingPct: 138.8, high: false },
  ],

  ecwTbw: {
    segmental: [
      { part: "Trunk", ratio: 0.364 },
      { part: "Left Arm", ratio: 0.379 },
      { part: "Right Arm", ratio: 0.376 },
      { part: "Left Leg", ratio: 0.362 },
      { part: "Right Leg", ratio: 0.365 },
    ],
    totalRatio: 0.366,
    totalBodyWaterL: 49.1,
    intracellularWaterL: 31.1,
    extracellularWaterL: 18.0,
    note: "Water balance normal/good. ECW/TBW 0.366 is not concerning.",
  },

  comprehensive: {
    bmrKcal: 1819,
    bmrKj: 7611,
    bmrAppEstimate: 1778,
    maintenanceEstimate: "2,600–3,200 kcal/day",
    legLeanMassLb: 39.9,
    phaseAngle: 7.1,
    phaseAngleApp: 7.2,
    armCircumferenceIn: 14.1,
    tbwFfmPct: 73.2,
    ffmi: 23.5,
    smmWtPct: 45.6,
  },

  bodyBalance: {
    upperBody: "Balanced",
    lowerBody: "Balanced",
    upperLower: "Slightly Unbalanced",
    note: "Left-right balance is good. Upper vs lower slightly uneven — upper body/torso lean mass more developed than legs.",
  },

  control: {
    suggestedFatLossLb: 13.0,
    suggestedLeanGainLb: 0.0,
    targetWeightLb: 174,
    targetBodyFatPct: "14–16%",
    startWeightLb: 189.6,
    goalNote:
      "Lose 13 lb of fat while keeping muscle. Not skinny fat — solid muscle base. Main fat-loss target is trunk/waist/abdomen.",
  },

  summary: {
    headline: "Excellent muscle mass for your height — cut, don't bulk.",
    bullets: [
      "Arms, trunk, and total muscle are strong.",
      "Most fat is concentrated in the torso/trunk — main target for fat loss.",
      "Arms and legs are not the main issue.",
      "Keep 83–85 lb muscle mass; drop fat from ~39 lb toward ~25–30 lb.",
      "Real maintenance is ~2,600–3,200 kcal/day with movement and training — BMR alone is not maintenance.",
    ],
  },

  bioAge: {
    strengthAge: 21,
    flexibilityAge: 21,
    metabolismAge: 39,
    upperBodyStrengthAge: 21,
    egymChestPressLb: 207,
    appView: {
      bmi: 30.7,
      weightLb: 188,
      bodyFatLb: 44,
      bodyFatPct: 23.5,
      muscleMassLb: 83,
      fatFreeMassLb: 144,
      phaseAngle: 7.2,
    },
  },
} as const;

/** Map to body_metrics row for DB sync */
export function inbodyToBodyMetric(date = INBODY_SCAN_DATE) {
  const r = INBODY_REPORT;
  return {
    date,
    weight_lbs: r.bodyComposition.weightLb,
    body_fat_pct: r.obesityAnalysis.percentBodyFat,
    muscle_mass_lbs: r.bioAge.appView.muscleMassLb,
    skeletal_muscle_lbs: r.muscleFatAnalysis.skeletalMuscleMassLb,
    bmi: r.obesityAnalysis.bmi,
    visceral_fat: r.obesityAnalysis.visceralFatAreaCm2,
    inbody_score: r.meta.score,
    body_water_pct: r.comprehensive.tbwFfmPct,
    bmr: r.comprehensive.bmrKcal,
    notes: `InBody 580 — ${date} 11:57. Score ${r.meta.score}. D-Type above average. Phase angle ${r.comprehensive.phaseAngle}°. FFMI ${r.comprehensive.ffmi}. Target: -${r.control.suggestedFatLossLb} lb fat → ~${r.control.targetWeightLb} lb @ ${r.control.targetBodyFatPct} BF.`,
  };
}
