import { describe, expect, it } from "vitest";
import {
  DEFAULT_GATE_PARAMS,
  type GateParams,
  abSampleSizePerArm,
  bandFalseAlarmRateR3,
  bandWidthForFalseAlarmR3,
  canaryDetection,
  certificationSampleSize,
  familywiseAlarmRate,
  FIGURE3_READINGS,
  fitRetryCurve,
  humanBandCheck,
  independentEscapeProbability,
  maxEscapeProbability,
  noJudgeSummary,
  requiredSampleSize,
  roganGladenPrevalence,
  sdIntervalMultipliersDf2,
  selfInclusionAgreement,
  servedDefectRate,
  servedStrata,
  servedStrataSweep,
  retryMarginalValue,
  signTestTwoSided,
  simulateGate,
  stratifiedSampleSpecificity,
  summarizeGate,
  sweepRetryBudget,
  wilsonInterval,
} from "./llm-judge-lifecycle";

const at = (overrides: Partial<GateParams>) => summarizeGate(simulateGate({ ...DEFAULT_GATE_PARAMS, ...overrides }));

describe("gate + bounded-retry model", () => {
  it("conserves probability mass for arbitrary parameters", () => {
    let seed = 7;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < 200; i++) {
      const o = simulateGate({
        firstDraftDefectRate: rand(),
        hardShare: rand(),
        fixRate: rand(),
        regressionRate: rand(),
        specificity: rand(),
        recall: rand(),
        persistence: rand(),
        retryBudget: Math.floor(rand() * 13),
      });
      expect(o.servedGood + o.servedBad + o.droppedGood + o.droppedBad).toBeCloseTo(1, 12);
      expect(o.cumulativeServed.at(-1)).toBeCloseTo(o.servedGood + o.servedBad, 12);
    }
  });

  it("reduces to single-attempt formulas when K = 0", () => {
    const p = { ...DEFAULT_GATE_PARAMS, retryBudget: 0 };
    const s = summarizeGate(simulateGate(p));
    const bad = p.hardShare + (1 - p.hardShare) * p.firstDraftDefectRate;
    expect(s.servedRate).toBeCloseTo(bad * (1 - p.specificity) + (1 - bad) * p.recall, 12);
    expect(s.escapeShare).toBeCloseTo(servedDefectRate(bad, p.specificity, p.recall), 12);
    expect(s.attemptsPerItem).toBe(1);
  });

  it("reproduces the numbers quoted in the article for the default parameters", () => {
    const none = noJudgeSummary(DEFAULT_GATE_PARAMS);
    expect(none.escapeShare).toBeCloseTo(0.68, 12);

    const k0 = at({ retryBudget: 0 });
    expect(k0.servedRate).toBeCloseTo(0.324, 3);
    expect(k0.escapeShare).toBeCloseTo(0.2099, 3);
    expect(k0.escapesPerItem * 1e4).toBeCloseTo(680, 0);

    const k3 = at({ retryBudget: 3 });
    expect(k3.servedRate).toBeCloseTo(0.740, 3);
    expect(k3.escapeShare).toBeCloseTo(0.159, 3);
    expect(k3.escapesPerItem * 1e4).toBeCloseTo(1176, 0);
    expect(k3.attemptsPerItem).toBeCloseTo(2.48, 2);

    const independent = at({ retryBudget: 3, persistence: 0 });
    expect(independent.servedRate).toBeCloseTo(0.779, 3);
    expect(independent.escapesPerItem * 1e4).toBeCloseTo(1664, 0);

    const persistent = at({ retryBudget: 3, persistence: 1 });
    expect(persistent.servedRate).toBeCloseTo(0.701, 3);
    expect(persistent.escapesPerItem * 1e4).toBeCloseTo(688, 0);
  });

  it("never serves a defect with a perfect judge, and drops every hard item", () => {
    const o = simulateGate({ ...DEFAULT_GATE_PARAMS, specificity: 1, recall: 1, retryBudget: 12 });
    expect(o.servedBad).toBe(0);
    expect(o.droppedBad).toBeGreaterThanOrEqual(DEFAULT_GATE_PARAMS.hardShare - 1e-12);
  });

  it("amplifies escapes of always-bad items as 1 − s^(K+1) when misses are independent", () => {
    for (const K of [0, 1, 3, 12]) {
      const o = simulateGate({ ...DEFAULT_GATE_PARAMS, hardShare: 1, persistence: 0, retryBudget: K });
      expect(o.servedBad).toBeCloseTo(independentEscapeProbability(0.9, K), 12);
    }
    expect(independentEscapeProbability(0.9, 3)).toBeCloseTo(0.3439, 12);
  });

  it("does not amplify escapes of always-bad items when misses are fully persistent", () => {
    for (const K of [0, 3, 12]) {
      const o = simulateGate({ ...DEFAULT_GATE_PARAMS, hardShare: 1, persistence: 1, retryBudget: K });
      expect(o.servedBad).toBeCloseTo(0.1, 12);
    }
  });

  it("serves more as the retry budget grows", () => {
    const sweep = sweepRetryBudget(DEFAULT_GATE_PARAMS, 12);
    for (let k = 1; k < sweep.length; k++) {
      expect(sweep[k].servedRate).toBeGreaterThanOrEqual(sweep[k - 1].servedRate - 1e-12);
      expect(sweep[k].escapesPerItem).toBeGreaterThanOrEqual(sweep[k - 1].escapesPerItem - 1e-12);
    }
    const curve = simulateGate({ ...DEFAULT_GATE_PARAMS, retryBudget: 12 }).cumulativeServed;
    for (let k = 1; k < curve.length; k++) expect(curve[k]).toBeGreaterThanOrEqual(curve[k - 1]);
  });

  it("clamps out-of-range inputs instead of producing negative probabilities", () => {
    const o = simulateGate({ ...DEFAULT_GATE_PARAMS, specificity: 1.4, recall: -0.2, retryBudget: 2.7 });
    expect(o.cumulativeServed).toHaveLength(3);
    for (const v of [o.servedGood, o.servedBad, o.droppedGood, o.droppedBad]) expect(v).toBeGreaterThanOrEqual(0);
  });

  it("puts the post-revision stratum between ~0 (persistent misses) and the first-pass share (independent misses)", () => {
    const persistent = servedStrata({ ...DEFAULT_GATE_PARAMS, persistence: 1 });
    const middle = servedStrata(DEFAULT_GATE_PARAMS);
    const independent = servedStrata({ ...DEFAULT_GATE_PARAMS, persistence: 0 });
    for (const s of [persistent, middle, independent]) expect(s.firstPassShare).toBeCloseTo(0.2099, 4);
    expect(persistent.postRevisionShare).toBeCloseTo(0.002, 3);
    expect(middle.postRevisionShare).toBeCloseTo(0.119, 3);
    expect(independent.postRevisionShare).toBeCloseTo(0.216, 3);
    expect(servedStrata({ ...DEFAULT_GATE_PARAMS, retryBudget: 0 }).postRevisionServed).toBe(0);
  });

  it("shows that the post-revision share alone does not reveal ρ (parameter sweep)", () => {
    const independent = servedStrataSweep(0);
    const persistent = servedStrataSweep(1);
    expect(independent.combinations).toBe(5400);
    expect(independent.minGap).toBeCloseTo(-0.786, 3);
    expect(independent.maxGap).toBeCloseTo(0.716, 3);
    expect(persistent.maxPostShare).toBeCloseTo(0.16, 2);
    const unfixableHeavy = servedStrata({ ...DEFAULT_GATE_PARAMS, hardShare: 0.5, persistence: 0 });
    expect(unfixableHeavy.firstPassShare).toBeCloseTo(0.333, 3);
    expect(unfixableHeavy.postRevisionShare).toBeCloseTo(0.407, 3);
  });

  it("values what retries add on top of K = 0 against the break-even defect rate", () => {
    const middle = retryMarginalValue(DEFAULT_GATE_PARAMS);
    expect(middle.breakEvenShare).toBeCloseTo(1 / 51, 12);
    expect(middle.addedGood * 1e4).toBeCloseTo(3661, 0);
    expect(middle.addedBad * 1e4).toBeCloseTo(496, 0);
    expect(middle.net * 1e4).toBeCloseTo(-21136, -1);
    const persistent = retryMarginalValue({ ...DEFAULT_GATE_PARAMS, persistence: 1 });
    expect(persistent.addedGood * 1e4).toBeCloseTo(3758, 0);
    expect(persistent.addedBad * 1e4).toBeCloseTo(8, 0);
    expect(persistent.net).toBeGreaterThan(0);
    const share = middle.addedBad / (middle.addedGood + middle.addedBad);
    expect(share).toBeCloseTo(servedStrata(DEFAULT_GATE_PARAMS).postRevisionShare, 12);
  });

  it("bounds escapes of always-bad items by the union bound for any correlation", () => {
    expect(maxEscapeProbability(0.9, 3)).toBeCloseTo(0.4, 12);
    expect(maxEscapeProbability(0.5, 3)).toBe(1);
    for (const K of [0, 1, 3, 12]) {
      expect(independentEscapeProbability(0.9, K)).toBeLessThanOrEqual(maxEscapeProbability(0.9, K) + 1e-12);
    }
  });

  it("inverts the judge's fail rate back to the prevalence (Rogan–Gladen)", () => {
    const prevalence = 0.68;
    const failRate = prevalence * 0.9 + (1 - prevalence) * (1 - 0.8);
    expect(roganGladenPrevalence(failRate, 0.9, 0.8)).toBeCloseTo(prevalence, 12);
  });
});

describe("statistics quoted in the article", () => {
  it("sign test granularity with 8 seeds", () => {
    expect(signTestTwoSided(8, 8)).toBeCloseTo(0.0078, 4);
    expect(signTestTwoSided(8, 7)).toBeCloseTo(0.0703, 4);
    expect(signTestTwoSided(7, 7)).toBeCloseTo(0.0156, 4);
    expect(signTestTwoSided(6, 6)).toBeCloseTo(0.03125, 6);
    expect(signTestTwoSided(8, 0)).toBeCloseTo(0.0078, 4);
  });

  it("Wilson interval for the meta-judge validation (296/300 ≈ 98.6%)", () => {
    const [lo, hi] = wilsonInterval(296, 300);
    expect(lo).toBeCloseTo(0.966, 3);
    expect(hi).toBeCloseTo(0.995, 3);
  });

  it("sample sizes", () => {
    expect(requiredSampleSize(0.9, 0.05)).toBe(139);
    expect(requiredSampleSize(0.9, 0.03)).toBe(385);
    expect(abSampleSizePerArm(0.5, 0.003) / 1e6).toBeCloseTo(1.74, 2);
    expect(abSampleSizePerArm(0.3, 0.003) / 1e6).toBeCloseTo(4.07, 2);
  });

  it("certification sample sizes for 80% power against a Specificity floor", () => {
    expect(certificationSampleSize(0.95, 0.97, "wald")).toBe(450);
    expect(certificationSampleSize(0.95, 0.97, "score")).toBe(630);
    expect(certificationSampleSize(0.98, 0.99, "wald")).toBe(612);
    expect(certificationSampleSize(0.98, 0.99, "score")).toBe(986);
  });

  it("daily canary: exact-binomial threshold and one-day detection power", () => {
    const shifted = canaryDetection(150, 0.02, 0.06);
    expect(shifted.threshold).toBe(9);
    expect(shifted.falseAlarm).toBeLessThan(0.01);
    expect(canaryDetection(150, 0.02, 0.02).power).toBeCloseTo(shifted.falseAlarm, 12);
    expect(shifted.power).toBeCloseTo(0.548, 3);
    expect(canaryDetection(150, 0.02, 0.1).power).toBeCloseTo(0.969, 3);
    expect(canaryDetection(150, 0.02, 0.06, 0.05).threshold).toBeLessThan(9);
  });

  it("reproduces the Figure 3 curve fits quoted in §4.2(d)", () => {
    const ratios: number[] = [];
    const h: Record<string, number> = {};
    for (const [model, curve] of Object.entries(FIGURE3_READINGS)) {
      const mixture = fitRetryCurve(curve);
      const homogeneous = fitRetryCurve(curve, true);
      ratios.push(homogeneous.sse / mixture.sse);
      h[model] = mixture.h;
    }
    expect(Math.round(Math.min(...ratios))).toBe(11);
    expect(Math.round(Math.max(...ratios))).toBe(57);
    expect(h.model1).toBeCloseTo(0.2, 2);
    expect(h.model3).toBeGreaterThanOrEqual(0.4);
    expect(h.model3).toBeLessThanOrEqual(0.5);
  });

  it("uncertainty of a 3-rater standard deviation", () => {
    const [lo, hi] = sdIntervalMultipliersDf2();
    expect(lo).toBeCloseTo(0.52, 2);
    expect(hi).toBeCloseTo(6.28, 2);
  });

  it("self-inclusion advantage of raters scored against their own majority", () => {
    const a8 = selfInclusionAgreement(0.8);
    expect(a8.rater).toBeCloseTo(0.84, 6);
    expect(a8.outsider).toBeCloseTo(0.7376, 4);
    const a9 = selfInclusionAgreement(0.9);
    expect(a9.rater).toBeCloseTo(0.91, 6);
    expect(a9.outsider).toBeCloseTo(0.878, 3);
  });

  it("human band check (Eq. 5)", () => {
    const band = humanBandCheck(0.86, [0.92, 0.88, 0.9]);
    expect(band.mean).toBeCloseTo(0.9, 12);
    expect(band.sd).toBeCloseTo(0.02, 12);
    expect(band.lower).toBeCloseTo(0.86, 12);
    expect(band.pass).toBe(true);
    expect(humanBandCheck(0.85, [0.92, 0.88, 0.9]).pass).toBe(false);
    const population = humanBandCheck(0.86, [0.92, 0.88, 0.9], 2, "population");
    expect(population.lower).toBeCloseTo(0.867, 3);
    expect(population.pass).toBe(false);
  });

  it("calibrates the 2-sd band as a t prediction interval with three raters", () => {
    expect(bandFalseAlarmRateR3(2)).toBeCloseTo(0.1127, 4);
    expect(bandWidthForFalseAlarmR3(0.05)).toBeCloseTo(3.37, 2);
    expect(bandFalseAlarmRateR3(bandWidthForFalseAlarmR3(0.05))).toBeCloseTo(0.05, 10);
    expect(familywiseAlarmRate(bandFalseAlarmRateR3(2), 18)).toBeCloseTo(0.884, 3);
  });

  it("shows that a decision-stratified sample's specificity depends on the allocation", () => {
    const strata = (served1: number, served2: number, dropped: number) => [
      { draws: served1, humanFailRate: 0.05, judgeFails: false },
      { draws: served2, humanFailRate: 0.05, judgeFails: false },
      { draws: dropped, humanFailRate: 0.7, judgeFails: true },
    ];
    expect(stratifiedSampleSpecificity(strata(0.5, 0.25, 0.25))).toBeCloseTo(0.8235, 4);
    expect(stratifiedSampleSpecificity(strata(100, 100, 100))).toBeCloseTo(0.875, 4);
    expect(stratifiedSampleSpecificity(strata(150, 100, 50))).toBeCloseTo(0.7368, 4);
  });

  it("served defect rate (base-rate effect)", () => {
    expect(servedDefectRate(0.68, 0.9, 0.8)).toBeCloseTo(0.2099, 4);
    expect(servedDefectRate(0.1, 0.9, 0.8)).toBeCloseTo(0.0137, 4);
  });
});
