"use client";

import { INBODY_REPORT, INBODY_SCAN_DATE } from "@/lib/inbody-report";
import { Card } from "./ui";

function MetricRow({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[var(--card-border)]/60 py-2 last:border-0">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <div className="text-right">
        <span className="text-sm font-semibold">{value}</span>
        {note && <p className="text-[10px] text-[var(--accent-warm)]">{note}</p>}
      </div>
    </div>
  );
}

function SegmentGrid({
  title,
  items,
  type,
}: {
  title: string;
  type: "lean" | "fat";
  items: readonly { part: string; massLb: number; ratingPct: number; high?: boolean; label?: string }[];
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{title}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {items.map((seg) => (
          <div
            key={seg.part}
            className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-2 text-center"
          >
            <p className="text-[10px] text-[var(--muted)]">{seg.part}</p>
            <p className="text-sm font-semibold">{seg.massLb} lb</p>
            <p
              className={`text-[10px] ${
                type === "lean"
                  ? seg.label?.includes("above")
                    ? "text-[var(--accent)]"
                    : "text-[var(--muted)]"
                  : seg.high
                  ? "text-[var(--accent-warm)]"
                  : "text-[var(--muted)]"
              }`}
            >
              {seg.ratingPct}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function InBodyReportCard() {
  const r = INBODY_REPORT;

  return (
    <Card title={`Main InBody Result — ${INBODY_SCAN_DATE}`}>
      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted)]">
        <span>{r.meta.testTime}</span>
        <span>{r.meta.device}</span>
        <span>{r.meta.height}</span>
        <span>Age {r.meta.age}</span>
        <span>{r.meta.sex}</span>
        <span className="font-semibold text-[var(--accent)]">Score {r.meta.score} pts</span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {[
          { label: "Weight", value: `${r.bodyComposition.weightLb} lb` },
          { label: "Body Fat %", value: `${r.obesityAnalysis.percentBodyFat}%`, sub: `${r.obesityAnalysis.percentBodyFatOfficial}% official` },
          { label: "Fat Mass", value: `${r.bodyComposition.bodyFatMassLb} lb` },
          { label: "SMM", value: `${r.muscleFatAnalysis.skeletalMuscleMassLb} lb` },
          { label: "Fat-Free Mass", value: `${r.bodyComposition.fatFreeMassLb} lb` },
          { label: "BMR", value: `${r.comprehensive.bmrKcal} kcal` },
        ].map((t) => (
          <div key={t.label} className="rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-2.5 text-center">
            <p className="text-[10px] text-[var(--muted)]">{t.label}</p>
            <p className="text-sm font-bold">{t.value}</p>
            {"sub" in t && t.sub && <p className="text-[9px] text-[var(--muted)]">{t.sub}</p>}
          </div>
        ))}
      </div>

      <div className="mb-4 rounded-xl border border-[var(--accent-warm)]/30 bg-[var(--accent-warm)]/10 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-warm)]">
          {r.muscleFatAnalysis.classification}
        </p>
        <p className="mt-1 text-sm">{r.muscleFatAnalysis.classificationNote}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--background)] p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Body Composition Analysis
          </p>
          <MetricRow label="Weight" value={`${r.bodyComposition.weightLb} lb`} />
          <MetricRow label="Total Body Water" value={`${r.bodyComposition.totalBodyWaterLb} lb`} />
          <MetricRow label="Intracellular Water" value={`${r.bodyComposition.intracellularWaterLb} lb`} />
          <MetricRow label="Extracellular Water" value={`${r.bodyComposition.extracellularWaterLb} lb`} />
          <MetricRow label="Dry Lean Mass" value={`${r.bodyComposition.dryLeanMassLb} lb`} />
          <MetricRow label="Body Fat Mass" value={`${r.bodyComposition.bodyFatMassLb} lb`} />
          <MetricRow label="Fat Free Mass" value={`${r.bodyComposition.fatFreeMassLb} lb`} />
        </div>

        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--background)] p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Obesity / Fat Analysis
          </p>
          <MetricRow label="BMI" value={`${r.obesityAnalysis.bmi} kg/m²`} />
          <MetricRow
            label="Percent Body Fat"
            value={`${r.obesityAnalysis.percentBodyFat}%`}
            note={`Official report: ${r.obesityAnalysis.percentBodyFatOfficial}%`}
          />
          <MetricRow label="Body Fat Mass" value={`${r.obesityAnalysis.bodyFatMassLb} lb`} />
          <MetricRow label="Visceral Fat Area" value={`${r.obesityAnalysis.visceralFatAreaCm2} cm²`} />
          <MetricRow
            label="Visceral Fat Level"
            value={`${r.obesityAnalysis.visceralFatLevel} (app: ${r.obesityAnalysis.visceralFatLevelApp})`}
          />
          <MetricRow label="Phase Angle" value={`${r.comprehensive.phaseAngle}°`} note={`App: ${r.comprehensive.phaseAngleApp}°`} />
          <MetricRow label="FFMI" value={`${r.comprehensive.ffmi} kg/m²`} />
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <SegmentGrid title="Segmental Lean Mass" items={r.segmentalLean} type="lean" />
        <SegmentGrid title="Segmental Fat Mass" items={r.segmentalFat} type="fat" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--background)] p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            ECW / TBW — Water Balance
          </p>
          {r.ecwTbw.segmental.map((s) => (
            <MetricRow key={s.part} label={`${s.part} ECW Ratio`} value={String(s.ratio)} />
          ))}
          <MetricRow label="Total ECW/TBW" value={String(r.ecwTbw.totalRatio)} />
          <MetricRow label="Total Body Water" value={`${r.ecwTbw.totalBodyWaterL} L`} />
          <p className="mt-2 text-xs text-[var(--muted)]">{r.ecwTbw.note}</p>
        </div>

        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--background)] p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Comprehensive & Balance
          </p>
          <MetricRow label="BMR (InBody)" value={`${r.comprehensive.bmrKcal} kcal`} />
          <MetricRow label="BMR (app est.)" value={`${r.comprehensive.bmrAppEstimate} kcal`} />
          <MetricRow label="Maintenance est." value={r.comprehensive.maintenanceEstimate} />
          <MetricRow label="Leg Lean Mass" value={`${r.comprehensive.legLeanMassLb} lb`} />
          <MetricRow label="Arm Circumference" value={`${r.comprehensive.armCircumferenceIn} in`} />
          <MetricRow label="SMM/WT" value={`${r.comprehensive.smmWtPct}%`} />
          <MetricRow label="Upper Body" value={r.bodyBalance.upperBody} />
          <MetricRow label="Lower Body" value={r.bodyBalance.lowerBody} />
          <MetricRow label="Upper–Lower" value={r.bodyBalance.upperLower} />
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/8 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)] mb-2">
          InBody Control Recommendation
        </p>
        <p className="text-lg font-bold">
          −{r.control.suggestedFatLossLb} lb fat · +{r.control.suggestedLeanGainLb} lb lean
        </p>
        <p className="mt-1 text-sm">
          {r.control.startWeightLb} lb → <span className="font-bold text-[var(--accent)]">~{r.control.targetWeightLb} lb</span> @{" "}
          {r.control.targetBodyFatPct} body fat
        </p>
        <p className="mt-2 text-xs text-[var(--muted)]">{r.control.goalNote}</p>
      </div>

      <div className="mt-4 rounded-xl border border-[var(--card-border)] bg-[var(--background)] p-3">
        <p className="text-sm font-semibold">{r.summary.headline}</p>
        <ul className="mt-2 space-y-1.5">
          {r.summary.bullets.map((b) => (
            <li key={b} className="flex gap-2 text-xs text-[var(--muted)]">
              <span className="text-[var(--accent)]">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>

      <details className="mt-4 rounded-xl border border-[var(--card-border)] bg-[var(--background)] p-3">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          BioAge App Data
        </summary>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <MetricRow label="Strength BioAge" value={`${r.bioAge.strengthBioAge} yrs`} />
          <MetricRow label="Upper Body Age" value={`${r.bioAge.upperBodyStrengthAge} yrs`} />
          <MetricRow label="Lower Body Age" value={`${r.bioAge.lowerBodyStrengthAge} yrs`} />
          <MetricRow label="EGYM Chest Press" value={`${r.bioAge.egymChestPressLb} lb`} />
          <MetricRow label="App BF %" value={`${r.bioAge.appView.bodyFatPct}%`} />
          <MetricRow label="App Muscle Mass" value={`${r.bioAge.appView.skeletalMuscleMassLb} lb`} />
        </div>
      </details>
    </Card>
  );
}
