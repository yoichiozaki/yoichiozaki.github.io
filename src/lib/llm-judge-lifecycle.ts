/*
 * Pure models behind the "LLM-as-a-Judge lifecycle" article
 * (content/blog/{ja,en}/llm-as-a-judge-lifecycle.mdx).
 *
 * The gate model is a small Markov chain over attempts k = 0..K of the
 * generate → judge → revise loop described in §6.1 of
 * "The Lifecycle of LLM-as-a-Judge for Large-Scale Recommendation
 * Explanations" (arXiv:2608.18300). Ground truth ("good"/"bad") is the
 * human label; the judge is summarized by the paper's specificity
 * (fail-recall) and recall (pass-recall). Everything here is an
 * illustrative what-if model, not a reconstruction of Netflix's system.
 */

export type GateParams = {
  /** P(first draft of a fixable item is bad), by the human standard. */
  firstDraftDefectRate: number;
  /** Share of items whose drafts stay bad no matter how often they are revised. */
  hardShare: number;
  /** P(one revision turns a bad draft of a fixable item into a good one). */
  fixRate: number;
  /** P(revising a falsely rejected good draft makes it bad). */
  regressionRate: number;
  /** P(judge = fail | human = fail) — "specificity" in the paper's terms. */
  specificity: number;
  /** P(judge = pass | human = pass) — "recall" in the paper's terms. */
  recall: number;
  /**
   * How persistent the judge's misses are on a given item, in [0, 1].
   * 0 → every attempt is an independent draw (worst case for retries);
   * 1 → for each item the judge either always or never catches its defects.
   */
  persistence: number;
  /** Retry budget K: up to K revisions after the first draft. */
  retryBudget: number;
};

export type GateOutcome = {
  servedGood: number;
  servedBad: number;
  droppedGood: number;
  droppedBad: number;
  /** Expected number of drafts (generator calls) per item. */
  expectedAttempts: number;
  /** cumulativeServed[k] = P(item has been served within attempts 0..k). */
  cumulativeServed: number[];
};

export type GateSummary = {
  servedRate: number;
  /** P(bad | served): the defect share users actually see. */
  escapeShare: number;
  /** P(served and bad) per generated item. */
  escapesPerItem: number;
  dropRate: number;
  attemptsPerItem: number;
  attemptsPerServed: number;
};

export const DEFAULT_GATE_PARAMS: GateParams = {
  firstDraftDefectRate: 0.6,
  hardShare: 0.2,
  fixRate: 0.4,
  regressionRate: 0.1,
  specificity: 0.9,
  recall: 0.8,
  persistence: 0.5,
  retryBudget: 3,
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

function runChain(
  defectRate: number,
  fixRate: number,
  regressionRate: number,
  specificity: number,
  recall: number,
  retryBudget: number,
): GateOutcome {
  let good = 1 - defectRate;
  let bad = defectRate;
  const out: GateOutcome = {
    servedGood: 0,
    servedBad: 0,
    droppedGood: 0,
    droppedBad: 0,
    expectedAttempts: 0,
    cumulativeServed: [],
  };
  let served = 0;
  for (let k = 0; k <= retryBudget; k++) {
    out.expectedAttempts += good + bad;
    const passGood = good * recall;
    const passBad = bad * (1 - specificity);
    out.servedGood += passGood;
    out.servedBad += passBad;
    served += passGood + passBad;
    out.cumulativeServed.push(served);
    const rejectedGood = good - passGood;
    const rejectedBad = bad - passBad;
    if (k === retryBudget) {
      out.droppedGood += rejectedGood;
      out.droppedBad += rejectedBad;
    } else {
      good = rejectedGood * (1 - regressionRate) + rejectedBad * fixRate;
      bad = rejectedGood * regressionRate + rejectedBad * (1 - fixRate);
    }
  }
  return out;
}

function combine(parts: Array<[number, GateOutcome]>): GateOutcome {
  const length = parts[0][1].cumulativeServed.length;
  const out: GateOutcome = {
    servedGood: 0,
    servedBad: 0,
    droppedGood: 0,
    droppedBad: 0,
    expectedAttempts: 0,
    cumulativeServed: new Array<number>(length).fill(0),
  };
  for (const [w, o] of parts) {
    out.servedGood += w * o.servedGood;
    out.servedBad += w * o.servedBad;
    out.droppedGood += w * o.droppedGood;
    out.droppedBad += w * o.droppedBad;
    out.expectedAttempts += w * o.expectedAttempts;
    for (let k = 0; k < length; k++) out.cumulativeServed[k] += w * o.cumulativeServed[k];
  }
  return out;
}

export function normalizeGateParams(p: GateParams): GateParams {
  return {
    firstDraftDefectRate: clamp01(p.firstDraftDefectRate),
    hardShare: clamp01(p.hardShare),
    fixRate: clamp01(p.fixRate),
    regressionRate: clamp01(p.regressionRate),
    specificity: clamp01(p.specificity),
    recall: clamp01(p.recall),
    persistence: clamp01(p.persistence),
    retryBudget: Math.max(0, Math.floor(p.retryBudget)),
  };
}

/**
 * Expected outcome per generated item. Hard items always produce bad drafts;
 * persistence mixes an "independent misses" judge with a judge whose catch/miss
 * decision is fixed per item (caught with probability = specificity).
 */
export function simulateGate(params: GateParams): GateOutcome {
  const p = normalizeGateParams(params);
  const population = (specificity: number) =>
    combine([
      [
        1 - p.hardShare,
        runChain(p.firstDraftDefectRate, p.fixRate, p.regressionRate, specificity, p.recall, p.retryBudget),
      ],
      [p.hardShare, runChain(1, 0, 0, specificity, p.recall, p.retryBudget)],
    ]);
  return combine([
    [1 - p.persistence, population(p.specificity)],
    [p.persistence * p.specificity, population(1)],
    [p.persistence * (1 - p.specificity), population(0)],
  ]);
}

export function summarizeGate(o: GateOutcome): GateSummary {
  const served = o.servedGood + o.servedBad;
  return {
    servedRate: served,
    escapeShare: served > 0 ? o.servedBad / served : 0,
    escapesPerItem: o.servedBad,
    dropRate: o.droppedGood + o.droppedBad,
    attemptsPerItem: o.expectedAttempts,
    attemptsPerServed: served > 0 ? o.expectedAttempts / served : Number.POSITIVE_INFINITY,
  };
}

/** Serving every first draft with no judge at all. */
export function noJudgeSummary(params: GateParams): GateSummary {
  const p = normalizeGateParams(params);
  const bad = p.hardShare + (1 - p.hardShare) * p.firstDraftDefectRate;
  return {
    servedRate: 1,
    escapeShare: bad,
    escapesPerItem: bad,
    dropRate: 0,
    attemptsPerItem: 1,
    attemptsPerServed: 1,
  };
}

export function sweepRetryBudget(params: GateParams, maxK: number): GateSummary[] {
  return Array.from({ length: maxK + 1 }, (_, k) =>
    summarizeGate(simulateGate({ ...params, retryBudget: k })),
  );
}

/** P(bad | judge passed) for a single attempt at defect prevalence π. */
export function servedDefectRate(prevalence: number, specificity: number, recall: number): number {
  const badPass = prevalence * (1 - specificity);
  const goodPass = (1 - prevalence) * recall;
  return badPass + goodPass > 0 ? badPass / (badPass + goodPass) : 0;
}

export type ServedStrata = {
  /** P(bad | served on the first attempt). Does not depend on K. */
  firstPassShare: number;
  /** P(bad | served after at least one revision); 0 when nothing is served after revision. */
  postRevisionShare: number;
  /** P(served after at least one revision) per generated item. */
  postRevisionServed: number;
};

/**
 * Defect shares of the two "served" strata that Phase IV samples. In this single-defect
 * model, fully persistent misses leave the post-revision stratum nearly clean (only defects
 * introduced by a revision and invisible to the judge get through); with independent misses
 * its level depends on the unfixable share and the fix rate, and can sit above or below the
 * first-pass share.
 */
export function servedStrata(params: GateParams): ServedStrata {
  const all = simulateGate(params);
  const first = simulateGate({ ...params, retryBudget: 0 });
  const firstServed = first.servedGood + first.servedBad;
  const postServed = all.servedGood + all.servedBad - firstServed;
  const postBad = all.servedBad - first.servedBad;
  return {
    firstPassShare: firstServed > 0 ? first.servedBad / firstServed : 0,
    postRevisionShare: postServed > 1e-12 ? postBad / postServed : 0,
    postRevisionServed: postServed,
  };
}

export type StrataSweep = { combinations: number; minGap: number; maxGap: number; maxPostShare: number };

/**
 * What retries add on top of K = 0, per generated item: every item served after a revision
 * would otherwise have been dropped. `net` values a served good item at `valueGood` and a
 * served defect at −`costDefect` (regeneration cost ignored).
 */
export function retryMarginalValue(
  params: GateParams,
  valueGood = 1,
  costDefect = 50,
): { addedGood: number; addedBad: number; net: number; breakEvenShare: number } {
  const all = simulateGate(params);
  const first = simulateGate({ ...params, retryBudget: 0 });
  const addedGood = all.servedGood - first.servedGood;
  const addedBad = all.servedBad - first.servedBad;
  return {
    addedGood,
    addedBad,
    net: valueGood * addedGood - costDefect * addedBad,
    breakEvenShare: valueGood / (valueGood + costDefect),
  };
}

/**
 * The parameter sweep quoted in the article (§6.2), at K = 3 and a fixed persistence:
 * 5 first-draft defect rates × 6 unfixable shares × 5 fix rates × 3 regression rates ×
 * 4 specificities × 3 recalls = 5,400 combinations. The gap is post-revision minus
 * first-pass defect share.
 */
export function servedStrataSweep(persistence: number): StrataSweep {
  const grid = (from: number, to: number, step: number) => {
    const out: number[] = [];
    for (let x = from; x <= to + 1e-9; x += step) out.push(Number(x.toFixed(2)));
    return out;
  };
  const result: StrataSweep = { combinations: 0, minGap: Infinity, maxGap: -Infinity, maxPostShare: 0 };
  for (const firstDraftDefectRate of grid(0.1, 0.9, 0.2))
    for (const hardShare of grid(0, 0.5, 0.1))
      for (const fixRate of grid(0.1, 0.9, 0.2))
        for (const regressionRate of [0, 0.1, 0.3])
          for (const specificity of [0.7, 0.8, 0.9, 0.95])
            for (const recall of [0.6, 0.8, 0.95]) {
              const s = servedStrata({
                firstDraftDefectRate,
                hardShare,
                fixRate,
                regressionRate,
                specificity,
                recall,
                persistence,
                retryBudget: 3,
              });
              if (s.postRevisionServed < 0.01) continue;
              result.combinations++;
              const gap = s.postRevisionShare - s.firstPassShare;
              result.minGap = Math.min(result.minGap, gap);
              result.maxGap = Math.max(result.maxGap, gap);
              result.maxPostShare = Math.max(result.maxPostShare, s.postRevisionShare);
            }
  return result;
}

/** P(an always-bad item is eventually served) with K retries and independent misses. */
export function independentEscapeProbability(specificity: number, retryBudget: number): number {
  return 1 - specificity ** (retryBudget + 1);
}

/** Union bound: the largest possible P(eventually served) for any correlation of misses. */
export function maxEscapeProbability(specificity: number, retryBudget: number): number {
  return Math.min(1, (retryBudget + 1) * (1 - specificity));
}

/** Rogan–Gladen: prevalence implied by the judge's observed fail rate, given Spec and Rec. */
export function roganGladenPrevalence(judgeFailRate: number, specificity: number, recall: number): number {
  return (judgeFailRate + recall - 1) / (specificity + recall - 1);
}

/** Two-sided exact sign test p-value for k successes out of n non-tied pairs. */
export function signTestTwoSided(n: number, k: number): number {
  const choose = (a: number, b: number) => {
    let r = 1;
    for (let i = 1; i <= b; i++) r = (r * (a - b + i)) / i;
    return r;
  };
  const extreme = Math.max(k, n - k);
  let tail = 0;
  for (let i = extreme; i <= n; i++) tail += choose(n, i);
  return Math.min(1, (2 * tail) / 2 ** n);
}

export const Z_95 = 1.959964;
export const Z_80_POWER = 0.841621;

export function wilsonInterval(successes: number, n: number, z = Z_95): [number, number] {
  const p = successes / n;
  const denom = 1 + (z * z) / n;
  const center = (p + (z * z) / (2 * n)) / denom;
  const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  return [center - half, center + half];
}

/** Human-failed examples needed to estimate a rate near p within ±margin (normal approx.). */
export function requiredSampleSize(p: number, margin: number, z = Z_95): number {
  return Math.ceil((z * z * p * (1 - p)) / (margin * margin));
}

export const Z_95_ONE_SIDED = 1.644854;

/**
 * Human-failed test examples per criterion needed so that a judge whose true rate is
 * `trueRate` passes a one-sided 95% lower-bound check against `floor` with the given
 * power (80% by default). "wald" uses the Wald bound; "score" the Wilson/score bound.
 */
export function certificationSampleSize(
  floor: number,
  trueRate: number,
  method: "wald" | "score",
  zAlpha = Z_95_ONE_SIDED,
  zBeta = Z_80_POWER,
): number {
  const gap = trueRate - floor;
  const spread =
    method === "wald"
      ? (zAlpha + zBeta) * Math.sqrt(trueRate * (1 - trueRate))
      : zAlpha * Math.sqrt(floor * (1 - floor)) + zBeta * Math.sqrt(trueRate * (1 - trueRate));
  return Math.round((spread / gap) ** 2);
}

function binomialUpperTail(k: number, n: number, p: number): number {
  let pmf = (1 - p) ** n;
  let below = 0;
  for (let i = 0; i < k; i++) {
    below += pmf;
    pmf *= ((n - i) / (i + 1)) * (p / (1 - p));
  }
  return Math.max(0, 1 - below);
}

export interface CanaryDetection {
  threshold: number;
  falseAlarm: number;
  power: number;
}

/**
 * Daily canary of `n` items whose verdict-flip rate is `baseRate` when nothing changed:
 * the smallest flip count that alerts at one-sided level `alpha` (exact binomial), the
 * resulting false-alarm rate, and the chance of alerting in one day if flips rise to `shiftedRate`.
 */
export function canaryDetection(n: number, baseRate: number, shiftedRate: number, alpha = 0.01): CanaryDetection {
  let threshold = 0;
  while (binomialUpperTail(threshold, n, baseRate) >= alpha) threshold++;
  return {
    threshold,
    falseAlarm: binomialUpperTail(threshold, n, baseRate),
    power: binomialUpperTail(threshold, n, shiftedRate),
  };
}

/** Cumulative pass rates read by eye from Figure 3 of the paper (k = 0..12). */
export const FIGURE3_READINGS: Record<string, number[]> = {
  model1: [0.3, 0.5, 0.62, 0.68, 0.72, 0.74, 0.76, 0.77, 0.78, 0.79, 0.8, 0.805, 0.81],
  model2: [0.235, 0.34, 0.43, 0.5, 0.55, 0.59, 0.62, 0.64, 0.655, 0.67, 0.68, 0.7, 0.71],
  model3: [0.05, 0.105, 0.17, 0.22, 0.25, 0.28, 0.31, 0.34, 0.36, 0.38, 0.405, 0.42, 0.445],
  model4: [0.225, 0.365, 0.45, 0.5, 0.54, 0.58, 0.6, 0.615, 0.635, 0.655, 0.665, 0.675, 0.68],
};

export type RetryCurveFit = { sse: number; h: number; a: number; g: number };

/**
 * Least-squares grid fit (step 0.01) of P_k = (1 − h)·[1 − (1 − a)(1 − g)^k]. With
 * `homogeneous` the unfixable share h is pinned to 0 (every item fixed at the same rate).
 */
export function fitRetryCurve(curve: number[], homogeneous = false): RetryCurveFit {
  const steps = (from: number, to: number) =>
    Array.from({ length: Math.round((to - from) / 0.01) + 1 }, (_, i) => Number((from + i * 0.01).toFixed(2)));
  const hs = homogeneous ? [0] : steps(0, 0.99);
  const as = steps(0, 1);
  const gs = steps(0.01, 1);
  const decay = gs.map((g) => curve.map((_, k) => (1 - g) ** k));
  let best: RetryCurveFit = { sse: Infinity, h: 0, a: 0, g: 0 };
  for (const h of hs)
    for (const a of as)
      for (let gi = 0; gi < gs.length; gi++) {
        let sse = 0;
        for (let k = 0; k < curve.length; k++) {
          const d = (1 - h) * (1 - (1 - a) * decay[gi][k]) - curve[k];
          sse += d * d;
        }
        if (sse < best.sse) best = { sse, h, a, g: gs[gi] };
      }
  return best;
}

/** Per-arm sample size for a two-proportion test detecting a relative lift. */
export function abSampleSizePerArm(
  baseRate: number,
  relativeLift: number,
  zAlpha = Z_95,
  zBeta = Z_80_POWER,
): number {
  const delta = baseRate * relativeLift;
  return ((zAlpha + zBeta) ** 2 * 2 * baseRate * (1 - baseRate)) / (delta * delta);
}

/** Multipliers [lo, hi] such that σ ∈ [lo·s, hi·s] at 95% when s has 2 degrees of freedom (R = 3). */
export function sdIntervalMultipliersDf2(): [number, number] {
  // χ² with 2 degrees of freedom is exponential: F(x) = 1 − e^{−x/2}.
  const quantile = (q: number) => -2 * Math.log(1 - q);
  return [Math.sqrt(2 / quantile(0.975)), Math.sqrt(2 / quantile(0.025))];
}

// Student's t with 2 degrees of freedom has closed forms for its CDF and quantile.
const tCdfDf2 = (t: number) => 0.5 + t / (2 * Math.sqrt(2 + t * t));
const tQuantileDf2 = (p: number) => (2 * p - 1) / Math.sqrt(2 * p * (1 - p));

/**
 * If the judge's metric and the three raters' metrics were exchangeable normal draws,
 * (M(J) − mean) / (s·√(1 + 1/3)) would follow t with 2 df. This is the false-alarm
 * probability of the rule M(J) ≥ mean − width·s for an equally good judge.
 */
export function bandFalseAlarmRateR3(width = 2): number {
  return tCdfDf2(-width / Math.sqrt(1 + 1 / 3));
}

/** The width (in units of s) that gives the requested false-alarm rate with three raters. */
export function bandWidthForFalseAlarmR3(alpha: number): number {
  return -tQuantileDf2(alpha) * Math.sqrt(1 + 1 / 3);
}

/** P(at least one alarm) across independent checks that each alarm with probability p. */
export function familywiseAlarmRate(p: number, checks: number): number {
  return 1 - (1 - p) ** checks;
}

/**
 * Under a symmetric-noise model where every rater (and the judge) is right with
 * probability a on a binary item: agreement of a rater with a 3-rater majority
 * that includes the rater's own vote, versus an equally accurate outsider.
 */
export function selfInclusionAgreement(a: number): { rater: number; outsider: number } {
  const majorityCorrect = a ** 3 + 3 * a ** 2 * (1 - a);
  return {
    rater: 1 - a * (1 - a),
    outsider: a * majorityCorrect + (1 - a) * (1 - majorityCorrect),
  };
}

export type BandCheck = { mean: number; sd: number; lower: number; pass: boolean };

/**
 * Eq. 5 of the paper: M(J) ≥ mean(M(H)) − 2·sd(M(H)). The paper does not say whether sd is
 * the sample (n − 1) or population (n) standard deviation; the sample sd is the default here.
 */
export function humanBandCheck(
  judgeScore: number,
  raterScores: number[],
  width = 2,
  sd: "sample" | "population" = "sample",
): BandCheck {
  const n = raterScores.length;
  const mean = raterScores.reduce((a, b) => a + b, 0) / n;
  const ss = raterScores.reduce((a, b) => a + (b - mean) ** 2, 0);
  const denom = sd === "sample" ? n - 1 : n;
  const std = denom > 0 ? Math.sqrt(ss / denom) : 0;
  const lower = mean - width * std;
  return { mean, sd: std, lower, pass: judgeScore >= lower - 1e-12 };
}

/**
 * Specificity of the judge on a sample stratified by the judge's own decision, where the
 * judge's label is "pass" in every served stratum and "fail" in the dropped stratum.
 * `draws` is the number of items drawn from a stratum (or its population volume, to get the
 * population value).
 */
export function stratifiedSampleSpecificity(
  strata: Array<{ draws: number; humanFailRate: number; judgeFails: boolean }>,
): number {
  let caught = 0;
  let fails = 0;
  for (const s of strata) {
    const f = s.draws * s.humanFailRate;
    fails += f;
    if (s.judgeFails) caught += f;
  }
  return fails > 0 ? caught / fails : Number.NaN;
}
