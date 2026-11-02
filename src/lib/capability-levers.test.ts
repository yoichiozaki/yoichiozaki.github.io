import { describe, expect, it } from "vitest";
import {
  ANCHORS,
  LEVER_KEYS,
  LEVER_RANGE,
  PRESET_2023,
  PRESET_2026,
  evaluate,
  interpolateLevers,
  rlProgress,
  sameLevers,
  sweepLever,
  type LeverKey,
  type Levers,
} from "./capability-levers";

const at = (overrides: Partial<Levers>, from: Levers = PRESET_2023) => evaluate({ ...from, ...overrides });

/** First lever value (scanning upward) at which `pred` holds, or Infinity. */
function firstWhere(from: Levers, key: LeverKey, pred: (l: Levers) => boolean): number {
  const { min, max } = LEVER_RANGE[key];
  for (let x = min; x <= max + 1e-9; x += 0.01) {
    if (pred({ ...from, [key]: x })) return x;
  }
  return Infinity;
}

describe("presets", () => {
  it("stay inside the lever ranges", () => {
    for (const preset of [PRESET_2023, PRESET_2026]) {
      for (const key of LEVER_KEYS) {
        expect(preset[key]).toBeGreaterThanOrEqual(LEVER_RANGE[key].min);
        expect(preset[key]).toBeLessThanOrEqual(LEVER_RANGE[key].max);
      }
    }
  });

  it("use GPT-4 as the 2023 baseline", () => {
    const o = evaluate(PRESET_2023);
    expect(o.trainingCost).toBeCloseTo(1, 10);
    expect(o.inferenceCostPerTask).toBeCloseTo(1, 10);
    expect(o.powerMW).toBeCloseTo(ANCHORS.baselinePowerMW, 10);
    expect(o.status).toEqual({ power: "ok", data: "ok", hbm: "ok", rl: "ok" });
  });

  it("anchor the 2026 preset on the figures cited in the article", () => {
    // Epoch AI: GPT-6 Astra ~9.4e26 FLOP, about 45x GPT-4's 2.1e25.
    expect(10 ** PRESET_2026.pretrain).toBeGreaterThan(40);
    expect(10 ** PRESET_2026.pretrain).toBeLessThan(50);
    // Compute for a given performance halves about every 8 months: 36 months -> ~x22.
    expect(10 ** PRESET_2026.algorithms).toBeCloseTo(2 ** (36 / 8), 0);
    // GPU energy efficiency +40%/yr for 3 years, times 2 for BF16 -> FP8.
    expect(10 ** PRESET_2026.hardware).toBeCloseTo(1.4 ** 3 * 2, 0);
    // RL "at pretraining scale": the same order of magnitude as pretraining compute.
    const rlCompute = ANCHORS.rlShareOfPretrain2023 * 10 ** PRESET_2026.rl;
    expect(rlCompute / 10 ** PRESET_2026.pretrain).toBeGreaterThan(0.3);
    expect(rlCompute / 10 ** PRESET_2026.pretrain).toBeLessThan(3);
  });

  it("put 2026 training power on Epoch AI's 2.2x-per-year trend from GPT-4", () => {
    const trend = ANCHORS.baselinePowerMW * 2.2 ** 3.5; // March 2023 -> autumn 2026
    const { powerMW } = evaluate(PRESET_2026);
    expect(powerMW).toBeGreaterThan(trend / 2);
    expect(powerMW).toBeLessThan(trend * 2);
    expect(powerMW).toBeGreaterThan(100); // "the largest runs now exceeding 100 MW"
  });

  it("put a 2e29 FLOP run (x10,000 GPT-4) inside Epoch AI's 4-16 GW range for 2030", () => {
    const { powerMW } = evaluate({ ...PRESET_2023, pretrain: 4, rl: 4, hardware: LEVER_RANGE.hardware.max });
    expect(powerMW).toBeGreaterThan(ANCHORS.powerOutlook2030GW[0] * 1000);
    expect(powerMW).toBeLessThan(ANCHORS.powerOutlook2030GW[1] * 1000);
  });

  it("shows the shift the article describes between 2023 and 2026", () => {
    const then = evaluate(PRESET_2023);
    const now = evaluate(PRESET_2026);
    expect(now.verifiable).toBeGreaterThan(then.verifiable + 40);
    expect(now.hard).toBeGreaterThan(then.hard + 30);
    // Checkable work gains more, and stays more predictable, than work that is hard to check.
    expect(now.verifiable - now.hard).toBeGreaterThan(8);
    expect(now.hardBand).toBeGreaterThan(now.verifiableBand);
    // Cost moves toward inference; the binding constraints move to HBM and RL environments.
    expect(now.inferenceCostPerTask).toBeGreaterThan(now.trainingCost);
    expect(now.status).toEqual({ power: "warn", data: "warn", hbm: "limit", rl: "warn" });
  });
});

describe("lever behaviour", () => {
  it("never lowers capability when a compute or efficiency lever is raised", () => {
    for (const from of [PRESET_2023, PRESET_2026]) {
      for (const key of ["pretrain", "rl", "inference", "coverage", "algorithms"] as const) {
        const sweep = sweepLever(from, key, 81);
        for (let i = 1; i < sweep.length; i++) {
          expect(sweep[i].outcome.verifiable).toBeGreaterThanOrEqual(sweep[i - 1].outcome.verifiable - 1e-9);
          expect(sweep[i].outcome.hard).toBeGreaterThanOrEqual(sweep[i - 1].outcome.hard - 1e-9);
        }
      }
    }
  });

  it("hardware efficiency lowers cost and power without changing capability", () => {
    const slow = evaluate(PRESET_2026);
    const fast = at({ hardware: LEVER_RANGE.hardware.max }, PRESET_2026);
    expect(fast.verifiable).toBeCloseTo(slow.verifiable, 10);
    expect(fast.hard).toBeCloseTo(slow.hard, 10);
    expect(fast.trainingCost).toBeLessThan(slow.trainingCost);
    expect(fast.inferenceCostPerTask).toBeLessThan(slow.inferenceCostPerTask);
    expect(fast.powerMW).toBeLessThan(slow.powerMW);
  });

  it("pretraining: capability keeps rising but the band widens and gains shrink per 10x", () => {
    const steps = [0, 1, 2, 3, 4].map((p) => at({ pretrain: p }));
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i].verifiableBand).toBeGreaterThan(steps[i - 1].verifiableBand);
    }
    const gains = steps.slice(1).map((s, i) => s.base - steps[i].base);
    for (let i = 1; i < gains.length; i++) expect(gains[i]).toBeLessThan(gains[i - 1]);
  });

  it("pretraining alone runs into power first, then data, before HBM", () => {
    const power = firstWhere(PRESET_2023, "pretrain", (l) => evaluate(l).status.power === "limit");
    const data = firstWhere(PRESET_2023, "pretrain", (l) => evaluate(l).status.data === "limit");
    const hbm = firstWhere(PRESET_2023, "pretrain", (l) => evaluate(l).status.hbm === "limit");
    expect(power).toBeLessThan(data);
    expect(data).toBeLessThan(hbm);
    expect(hbm).toBeLessThanOrEqual(LEVER_RANGE.pretrain.max);
  });

  it("RL saturates: ~10,000x of RL compute spans the S-curve from 5% to 95%", () => {
    const lo = firstWhere(PRESET_2023, "rl", (l) => rlProgress(l.rl) >= 0.05);
    const hi = firstWhere({ ...PRESET_2023, algorithms: 2 }, "rl", (l) => rlProgress(l.rl + l.algorithms) >= 0.95) + 2;
    expect(hi - lo).toBeGreaterThan(3.7);
    expect(hi - lo).toBeLessThan(4.6);
    // Near the top, more RL compute adds little.
    const g1 = at({ rl: 3 }, PRESET_2026).verifiable - at({ rl: 2 }, PRESET_2026).verifiable;
    const g2 = at({ rl: 4 }, PRESET_2026).verifiable - at({ rl: 3 }, PRESET_2026).verifiable;
    expect(g2).toBeLessThan(g1);
  });

  it("widening the range of checkable work raises the RL ceiling", () => {
    const narrow = at({ rl: 4, coverage: 0.1 });
    const wide = at({ rl: 4, coverage: 1 });
    expect(wide.verifiable - narrow.verifiable).toBeGreaterThan(15);
    expect(wide.hard).toBeGreaterThan(narrow.hard);
  });

  it("inference: 100x removes ~75% of the remaining failures for a model trained with RL", () => {
    const trained: Levers = { ...PRESET_2023, rl: 4, algorithms: 2, coverage: 1 };
    const s = evaluate(trained).rlProgress;
    expect(s).toBeGreaterThan(0.95);
    const fail = (t: number) => 97 - at({ inference: t }, trained).verifiable;
    expect(fail(2) / fail(0)).toBeGreaterThan(0.22);
    expect(fail(2) / fail(0)).toBeLessThan(0.3);
    // The share removed per 10x is constant (log-linear in thinking compute).
    expect(fail(1) / fail(0)).toBeCloseTo(fail(3) / fail(2), 10);
  });

  it("inference pays off far more when combined with RL, and costs grow linearly with it", () => {
    const thinkOnly = at({ inference: 3 }).verifiable - at({}).verifiable;
    const withRl = at({ rl: 4, inference: 3 }).verifiable - at({ rl: 4 }).verifiable;
    expect(withRl).toBeGreaterThan(2 * thinkOnly);
    expect(at({ inference: 3 }).inferenceCostPerTask).toBeCloseTo(1000, 6);
    expect(at({ inference: 3 }).status.hbm).toBe("limit");
  });

  it("checkable work benefits more than work that is hard to check", () => {
    const o = at({ rl: 4, inference: 3, coverage: 0.5 });
    expect(o.verifiable - o.base).toBeGreaterThan(2 * (o.hard - o.base));
  });
});

describe("helpers", () => {
  it("interpolates and compares lever settings", () => {
    const mid = interpolateLevers(PRESET_2023, PRESET_2026, 0.5);
    expect(mid.pretrain).toBeCloseTo(PRESET_2026.pretrain / 2, 10);
    expect(sameLevers(interpolateLevers(PRESET_2023, PRESET_2026, 1), PRESET_2026)).toBe(true);
    expect(sameLevers(mid, PRESET_2026)).toBe(false);
  });

  it("sweeps across the full range of a lever", () => {
    const sweep = sweepLever(PRESET_2026, "inference", 31);
    expect(sweep).toHaveLength(31);
    expect(sweep[0].x).toBe(LEVER_RANGE.inference.min);
    expect(sweep[30].x).toBeCloseTo(LEVER_RANGE.inference.max, 10);
  });
});
