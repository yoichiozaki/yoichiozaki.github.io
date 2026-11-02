/**
 * Conceptual model behind the "capability levers" figure in
 * content/blog/{ja,en}/ai-industry-capital-to-fcf.mdx (§5.2).
 *
 * This is an illustrative model, not a forecast. The curve shapes follow the
 * sources cited in the article; the constants are anchors chosen so that the
 * 2023 and 2026 presets land on published figures:
 *
 * - Pretraining: loss falls along a power law (Kaplan et al. 2020, Hoffmann
 *   et al. 2022), but how loss maps to capability is uncertain (Schaeffer et
 *   al. 2023), so the uncertainty band widens with extrapolation.
 * - RL with verifiable rewards: a saturating S-curve whose ceiling depends on
 *   the range of verifiable tasks; recipe improvements shift the curve left
 *   (Khatri et al. 2025).
 * - Inference-time compute: each 10x of thinking removes a roughly constant
 *   share of the remaining failures, about twice as steep per decade as RL
 *   (Toby Ord's reading of OpenAI's charts: AIME 20% -> 80% needs ~100x
 *   inference compute vs ~10,000x RL compute). Models that learned to reason
 *   through RL benefit far more.
 * - Algorithmic efficiency: the compute needed for a given performance halves
 *   about every 8 months (Ho et al. 2024) -> about x22 over 2023-2026.
 * - Hardware: energy efficiency of leading AI GPUs improves ~40%/yr (Epoch
 *   AI) and training moved from BF16 to FP8 -> about x5.6 over 2023-2026.
 *
 * Baseline (x1) is GPT-4: 2.1e25 FLOP and ~19 MW of training power (Epoch AI),
 * ~13T training tokens (reported). Public human-written text is ~300T tokens
 * (Villalobos et al. 2024).
 */

export type LeverKey = "pretrain" | "rl" | "inference" | "coverage" | "algorithms" | "hardware";

/** Log10 multipliers versus the 2023 baseline, except `coverage` (share, 0-1). */
export type Levers = Record<LeverKey, number>;

export type LeverRange = { min: number; max: number; step: number; log: boolean };

export const LEVER_KEYS: readonly LeverKey[] = ["pretrain", "rl", "inference", "coverage", "algorithms", "hardware"];

export const LEVER_RANGE: Record<LeverKey, LeverRange> = {
  pretrain: { min: 0, max: 4, step: 0.05, log: true }, // x1 (GPT-4) ... x10,000 (Epoch's 2030 feasibility)
  rl: { min: 0, max: 4, step: 0.05, log: true }, // x1 = 2023-era post-training (1% of GPT-4 pretraining)
  inference: { min: 0, max: 3, step: 0.05, log: true }, // thinking compute per task, x1 = direct answer
  coverage: { min: 0, max: 1, step: 0.01, log: false }, // share of checkable work with RL environments
  algorithms: { min: 0, max: 2, step: 0.05, log: true }, // effective compute per FLOP
  hardware: { min: 0, max: 1.5, step: 0.05, log: true }, // FLOP per dollar and per watt
};

export const PRESET_2023: Levers = {
  pretrain: 0,
  rl: 0,
  inference: 0,
  coverage: 0.1,
  algorithms: 0,
  hardware: 0,
};

export const PRESET_2026: Levers = {
  pretrain: 1.65, // ~x45: Epoch AI's estimate for GPT-6 Astra (9.4e26 FLOP)
  rl: 3.5, // ~32 GPT-4s of RL compute: RL "at pretraining scale"
  inference: 2, // ~x100 thinking per task
  coverage: 0.55, // math, competitive programming and parts of software work
  algorithms: 1.35, // ~x22: halving every ~8 months for ~3.5 years
  hardware: 0.75, // ~x5.6: +40%/yr GPU energy efficiency plus BF16 -> FP8
};

export const ANCHORS = {
  baselinePowerMW: 19,
  baselineTokensT: 13,
  publicTextTokensT: 300,
  rlShareOfPretrain2023: 0.01,
  powerOutlook2030GW: [4, 16] as const,
} as const;

const CAPABILITY_CEILING = 97;
const RL_CEILING = 95;

export type Status = "ok" | "warn" | "limit";

export type Outcome = {
  /** Capability from pretraining alone (0-100, relative). */
  base: number;
  /** Capability on work whose correctness can be checked (coding, math...). */
  verifiable: number;
  verifiableBand: number;
  /** Capability on work that is hard to check (long documents, judgment...). */
  hard: number;
  hardBand: number;
  /** Position on the RL S-curve (0-1). */
  rlProgress: number;
  /** Up-front training cost, 2023 baseline = 1. */
  trainingCost: number;
  /** Inference cost per task, 2023 direct answer = 1. */
  inferenceCostPerTask: number;
  /** Power drawn by one training run. */
  powerMW: number;
  /** Training tokens needed / public human-written text. */
  dataShare: number;
  /** Log10 pressure on HBM bandwidth per task (0 in 2023). */
  hbmPressure: number;
  status: { power: Status; data: Status; hbm: Status; rl: Status };
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Capability from pretraining: diminishing returns per 10x of effective compute. */
export function baseCapability(effectivePretrainLog: number): number {
  return 100 * (1 - 0.7 * 10 ** (-0.12 * effectivePretrainLog));
}

/**
 * Position on the RL S-curve for log10 effective RL compute. The slope makes
 * the curve span ~4 decades from 5% to 95%, versus ~2 decades for inference to
 * remove 75% of remaining failures (Ord: ~10,000x RL vs ~100x inference).
 */
export function rlProgress(effectiveRlLog: number): number {
  return 1 / (1 + 10 ** (-0.6 * (effectiveRlLog - 3.5)));
}

export function powerStatus(mw: number): Status {
  if (mw >= ANCHORS.powerOutlook2030GW[0] * 1000) return "limit";
  if (mw >= 100) return "warn";
  return "ok";
}

export function dataStatus(share: number): Status {
  if (share >= 1) return "limit";
  if (share >= 0.25) return "warn";
  return "ok";
}

export function hbmStatus(pressure: number): Status {
  if (pressure >= 1.5) return "limit";
  if (pressure >= 0.8) return "warn";
  return "ok";
}

export function rlStatus(progress: number): Status {
  if (progress >= 0.92) return "limit";
  if (progress >= 0.6) return "warn";
  return "ok";
}

export function evaluate(levers: Levers): Outcome {
  const p = clamp(levers.pretrain, LEVER_RANGE.pretrain.min, LEVER_RANGE.pretrain.max);
  const r = clamp(levers.rl, LEVER_RANGE.rl.min, LEVER_RANGE.rl.max);
  const t = clamp(levers.inference, LEVER_RANGE.inference.min, LEVER_RANGE.inference.max);
  const v = clamp(levers.coverage, LEVER_RANGE.coverage.min, LEVER_RANGE.coverage.max);
  const a = clamp(levers.algorithms, LEVER_RANGE.algorithms.min, LEVER_RANGE.algorithms.max);
  const hw = clamp(levers.hardware, LEVER_RANGE.hardware.min, LEVER_RANGE.hardware.max);

  // Algorithmic efficiency shifts the training curves left (more capability per FLOP).
  const effectivePretrain = p + a;
  const base = baseCapability(effectivePretrain);
  const s = rlProgress(r + a);

  // RL lifts checkable work toward a ceiling set by how much of that work has verifiers.
  const rlCeiling = base + (RL_CEILING - base) * (0.35 + 0.55 * v);
  const rlGain = (rlCeiling - base) * s;
  const afterRl = base + rlGain;
  // Only part of it transfers to work that is hard to check.
  const transfer = 0.05 + 0.3 * v;
  const hardAfterRl = base + rlGain * transfer;

  // Each 10x of thinking removes a constant share of remaining failures; much
  // more so for models that learned to reason (RL) and when answers can be checked.
  const kappa = 0.3 * (0.1 + 0.9 * s);
  const verifiable = CAPABILITY_CEILING - (CAPABILITY_CEILING - afterRl) * 10 ** (-kappa * t);
  const hard = CAPABILITY_CEILING - (CAPABILITY_CEILING - hardAfterRl) * 10 ** (-0.25 * kappa * t);

  // Uncertainty: the pretraining-to-capability mapping widens with extrapolation and
  // matters less once RL and thinking have closed most of the remaining gap.
  const sigmaBase = 2 + 3 * effectivePretrain;
  const remaining = (x: number) => (CAPABILITY_CEILING - x) / (CAPABILITY_CEILING - base);
  const verifiableBand =
    1 + Math.hypot(sigmaBase * remaining(verifiable), 0.12 * rlGain, 5 * v * s, 0.08 * (verifiable - afterRl));
  const hardBand =
    2 + Math.hypot(sigmaBase * remaining(hard), 0.06 * rlGain, 8 * v * s * transfer, 0.3 * (hard - hardAfterRl));

  const rl0 = ANCHORS.rlShareOfPretrain2023;
  const trainingCompute = (10 ** p + rl0 * 10 ** r) / (1 + rl0); // GPT-4 = 1
  const trainingCost = trainingCompute / 10 ** hw;
  const powerMW = (ANCHORS.baselinePowerMW * trainingCompute) / 10 ** hw;
  // Bigger pretraining -> bigger model (Chinchilla: params ~ compute^0.5); sparse
  // architectures (algorithms) cut bytes per token; HBM improves slower than compute.
  const inferenceCostPerTask = 10 ** (t + 0.5 * p - hw - 0.5 * a);
  const hbmPressure = t + 0.5 * p - 0.5 * hw - 0.5 * a;
  const dataShare = (ANCHORS.baselineTokensT * 10 ** (0.5 * p)) / ANCHORS.publicTextTokensT;

  return {
    base,
    verifiable,
    verifiableBand,
    hard,
    hardBand,
    rlProgress: s,
    trainingCost,
    inferenceCostPerTask,
    powerMW,
    dataShare,
    hbmPressure,
    status: {
      power: powerStatus(powerMW),
      data: dataStatus(dataShare),
      hbm: hbmStatus(hbmPressure),
      rl: rlStatus(s),
    },
  };
}

export type SweepPoint = { x: number; outcome: Outcome };

/** Evaluate the model across one lever's range, holding the others fixed. */
export function sweepLever(levers: Levers, key: LeverKey, points = 41): SweepPoint[] {
  const { min, max } = LEVER_RANGE[key];
  return Array.from({ length: points }, (_, i) => {
    const x = min + ((max - min) * i) / (points - 1);
    return { x, outcome: evaluate({ ...levers, [key]: x }) };
  });
}

export function interpolateLevers(from: Levers, to: Levers, t: number): Levers {
  const out = { ...from };
  for (const key of LEVER_KEYS) out[key] = from[key] + (to[key] - from[key]) * t;
  return out;
}

export function sameLevers(a: Levers, b: Levers, tolerance = 1e-6): boolean {
  return LEVER_KEYS.every((key) => Math.abs(a[key] - b[key]) <= tolerance);
}
