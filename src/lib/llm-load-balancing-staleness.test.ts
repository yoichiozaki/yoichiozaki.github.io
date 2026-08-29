import { describe, expect, it } from "vitest";
import {
  DEFAULT_STALENESS_CONFIG,
  STALENESS_POLICIES,
  compareStaleness,
  simulateStaleness,
  type StalenessConfig,
  type StalenessPolicy,
} from "./llm-load-balancing-model";

const config: StalenessConfig = { ...DEFAULT_STALENESS_CONFIG };

describe("simulateStaleness", () => {
  it("is deterministic and emits one entry per tick", () => {
    for (const policy of STALENESS_POLICIES) {
      const first = simulateStaleness(policy, config);
      const second = simulateStaleness(policy, config);
      expect(first.ticks).toHaveLength(config.horizonTicks);
      expect(first.maxSpread).toBe(second.maxSpread);
      expect(first.ticks.map((tick) => tick.placements)).toEqual(
        second.ticks.map((tick) => tick.placements),
      );
    }
  });

  it("conserves outstanding requests", () => {
    for (const policy of STALENESS_POLICIES) {
      const result = simulateStaleness(policy, config);
      for (const tick of result.ticks) {
        const total = tick.trueLoads.reduce((sum, value) => sum + value, 0);
        // Every arrival is in flight for exactly serviceTicks ticks, so the
        // total in flight can never exceed arrivals x service time.
        expect(total).toBeGreaterThanOrEqual(0);
        expect(total).toBeLessThanOrEqual(
          config.arrivalsPerTick * config.serviceTicks,
        );
        for (const load of tick.trueLoads) expect(load).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("reaches steady-state occupancy consistent with Little's law", () => {
    const result = simulateStaleness("power-of-two", config);
    const settled = result.ticks[result.ticks.length - 1];
    const total = settled.trueLoads.reduce((sum, value) => sum + value, 0);
    expect(total).toBe(config.arrivalsPerTick * config.serviceTicks);
  });

  it("herds badly when a stale view is trusted verbatim", () => {
    const naive = simulateStaleness("least-outstanding", config);
    // With every router reading the same stale snapshot, whole ticks land on
    // one replica.
    expect(naive.pileUpRate).toBeGreaterThan(0.5);
    expect(naive.maxSpread).toBeGreaterThan(config.arrivalsPerTick * 4);
  });

  it("reduces herding with in-flight accounting", () => {
    const naive = simulateStaleness("least-outstanding", config);
    const aware = simulateStaleness("in-flight-aware", config);
    expect(aware.maxSpread).toBeLessThan(naive.maxSpread);
    expect(aware.pileUpRate).toBeLessThan(naive.pileUpRate);
  });

  it("reduces herding with two random choices", () => {
    const naive = simulateStaleness("least-outstanding", config);
    const p2c = simulateStaleness("power-of-two", config);
    expect(p2c.maxSpread).toBeLessThan(naive.maxSpread);
    expect(p2c.pileUpRate).toBeLessThan(naive.pileUpRate);
  });

  it("does best when both corrections are combined", () => {
    const results = compareStaleness(config);
    const best = results.reduce((left, right) =>
      right.meanSpread < left.meanSpread ? right : left,
    );
    expect(best.policy).toBe("in-flight-aware-p2c");
  });

  it("removes the problem entirely when the view is always fresh", () => {
    const fresh = simulateStaleness("least-outstanding", {
      ...config,
      scrapeIntervalTicks: 1,
    });
    const stale = simulateStaleness("least-outstanding", config);
    expect(fresh.maxSpread).toBeLessThan(stale.maxSpread);
    expect(fresh.oscillation).toBeLessThan(stale.oscillation);
  });

  it("is helped by staggering scrapes across routers", () => {
    const together = simulateStaleness("least-outstanding", config);
    const staggered = simulateStaleness("least-outstanding", {
      ...config,
      staggerScrapes: true,
    });
    expect(staggered.maxSpread).toBeLessThanOrEqual(together.maxSpread);
  });

  it("rejects impossible configurations", () => {
    expect(() =>
      simulateStaleness("least-outstanding", { ...config, replicas: 1 }),
    ).toThrow(RangeError);
    expect(() =>
      simulateStaleness("least-outstanding", { ...config, routers: 0 }),
    ).toThrow(RangeError);
    expect(() =>
      simulateStaleness("least-outstanding", {
        ...config,
        scrapeIntervalTicks: 0,
      }),
    ).toThrow(RangeError);
    expect(() =>
      simulateStaleness("least-outstanding", { ...config, serviceTicks: 0 }),
    ).toThrow(RangeError);
    expect(() =>
      simulateStaleness("least-outstanding", { ...config, arrivalsPerTick: 0 }),
    ).toThrow(RangeError);
  });
});

describe("compareStaleness", () => {
  it("returns one result per policy in order", () => {
    expect(compareStaleness(config).map((result) => result.policy)).toEqual(
      STALENESS_POLICIES,
    );
  });

  // These numbers are quoted verbatim in the blog post's staleness table.
  // If the model or the defaults change, update both together.
  it("matches the table published in the article", () => {
    const results = compareStaleness(config);
    const byPolicy = Object.fromEntries(
      results.map((result) => [result.policy, result]),
    );
    const expected: Record<
      StalenessPolicy,
      { peak: number; mean: number; pileUp: number }
    > = {
      "least-outstanding": { peak: 21, mean: 12.0, pileUp: 64 },
      "in-flight-aware": { peak: 20, mean: 9.1, pileUp: 48 },
      "power-of-two": { peak: 9, mean: 5.2, pileUp: 21 },
      "in-flight-aware-p2c": { peak: 10, mean: 4.4, pileUp: 23 },
    };
    for (const policy of STALENESS_POLICIES) {
      const actual = byPolicy[policy];
      expect(actual.maxSpread).toBe(expected[policy].peak);
      expect(actual.meanSpread).toBeCloseTo(expected[policy].mean, 1);
      expect(Math.round(actual.pileUpRate * 100)).toBe(expected[policy].pileUp);
    }
  });
});

describe("what actually sets the herding amplitude", () => {
  // The article claims amplitude is set by how many requests are dispatched on
  // one stale snapshot, not by how many routers share that snapshot.
  it("is invariant to router count for the naive policy", () => {
    const runs = [1, 2, 4, 8, 16].map((routers) =>
      simulateStaleness("least-outstanding", { ...config, routers }),
    );
    for (const run of runs) {
      expect(run.maxSpread).toBe(runs[0].maxSpread);
      expect(run.meanSpread).toBeCloseTo(runs[0].meanSpread, 10);
      expect(run.pileUpRate).toBeCloseTo(runs[0].pileUpRate, 10);
    }
  });

  it("grows with the scrape interval until it saturates at the in-flight population", () => {
    const inFlight = config.arrivalsPerTick * config.serviceTicks;
    const peaks = [1, 2, 5, 10, 20].map(
      (scrapeIntervalTicks) =>
        simulateStaleness("least-outstanding", {
          ...config,
          scrapeIntervalTicks,
        }).maxSpread,
    );
    for (let index = 1; index < peaks.length; index += 1) {
      expect(peaks[index]).toBeGreaterThan(peaks[index - 1]);
    }
    expect(peaks[peaks.length - 1]).toBeLessThanOrEqual(inFlight);
  });

  it("grows with the arrival rate", () => {
    const peaks = [1, 2, 4].map(
      (arrivalsPerTick) =>
        simulateStaleness("least-outstanding", { ...config, arrivalsPerTick })
          .maxSpread,
    );
    for (let index = 1; index < peaks.length; index += 1) {
      expect(peaks[index]).toBeGreaterThan(peaks[index - 1]);
    }
  });

  it("degrades in-flight accounting as router count rises", () => {
    const single = simulateStaleness("in-flight-aware", {
      ...config,
      routers: 1,
    });
    const many = simulateStaleness("in-flight-aware", {
      ...config,
      routers: 16,
    });
    // With one router the correction is exact; with sixteen, each router sees
    // only 1/16 of the dispatches and the benefit nearly vanishes.
    expect(single.meanSpread).toBeLessThan(2);
    expect(many.meanSpread).toBeGreaterThan(single.meanSpread * 4);
  });

  it("beats P2C when a single router corrects for its own dispatches", () => {
    const single = simulateStaleness("in-flight-aware", {
      ...config,
      routers: 1,
    });
    const p2c = simulateStaleness("power-of-two", { ...config, routers: 1 });
    expect(single.meanSpread).toBeLessThan(p2c.meanSpread);
    expect(single.maxSpread).toBeLessThan(p2c.maxSpread);
  });
});

describe("sampledReplicas", () => {
  it("is null for full-scan policies and a pair for two-choice policies", () => {
    for (const policy of STALENESS_POLICIES) {
      const twoChoice =
        policy === "power-of-two" || policy === "in-flight-aware-p2c";
      for (const tick of simulateStaleness(policy, config).ticks) {
        for (const sampled of tick.sampledReplicas) {
          if (twoChoice) {
            expect(sampled).toHaveLength(2);
          } else {
            expect(sampled).toBeNull();
          }
        }
      }
    }
  });

  it("only ever probes replicas that exist", () => {
    for (const tick of simulateStaleness("power-of-two", config).ticks) {
      for (const sampled of tick.sampledReplicas) {
        for (const replica of sampled ?? []) {
          expect(replica).toBeGreaterThanOrEqual(0);
          expect(replica).toBeLessThan(config.replicas);
        }
      }
    }
  });

  // The UI accents the minimum of what the router looked at. That is only
  // honest if the dispatch really is the argmin over the probed pair.
  it("always dispatches to the lower of the two probed values", () => {
    for (const policy of ["power-of-two", "in-flight-aware-p2c"] as const) {
      for (const tick of simulateStaleness(policy, config).ticks) {
        tick.sampledReplicas.forEach((sampled, arrival) => {
          if (!sampled) throw new Error("expected a probed pair");
          const view = tick.effectiveViews[arrival];
          const chosen = tick.placements[arrival];
          expect(sampled).toContain(chosen);
          expect(view[chosen]).toBe(
            Math.min(...sampled.map((index) => view[index])),
          );
        });
      }
    }
  });

  it("lets a two-choice policy pass over a globally lower replica", () => {
    // If this never happened the accented-minimum bug would be invisible, so
    // the UI fix is only meaningful because the case is reachable.
    let passedOver = 0;
    for (const tick of simulateStaleness("power-of-two", config).ticks) {
      tick.sampledReplicas.forEach((sampled, arrival) => {
        const view = tick.effectiveViews[arrival];
        const chosen = tick.placements[arrival];
        if (view[chosen] > Math.min(...view)) passedOver += 1;
      });
    }
    expect(passedOver).toBeGreaterThan(0);
  });
});

describe("simulateStaleness input validation", () => {
  // Every numeric field should reject nonsense rather than return NaN.
  const bad: Array<[keyof typeof config, number]> = [
    ["replicas", 1],
    ["routers", 0],
    ["scrapeIntervalTicks", 0],
    ["serviceTicks", 0],
    ["arrivalsPerTick", 0],
    ["horizonTicks", 0],
  ];

  it.each(bad)("rejects %s = %i", (field, value) => {
    expect(() =>
      simulateStaleness("least-outstanding", { ...config, [field]: value }),
    ).toThrow(RangeError);
  });

  it("never reports a non-finite summary for any valid config", () => {
    for (const horizonTicks of [1, 2, 17, 90]) {
      const result = simulateStaleness("least-outstanding", {
        ...config,
        horizonTicks,
      });
      expect(Number.isFinite(result.maxSpread)).toBe(true);
      expect(Number.isFinite(result.meanSpread)).toBe(true);
      expect(Number.isFinite(result.oscillation)).toBe(true);
      expect(Number.isFinite(result.pileUpRate)).toBe(true);
    }
  });
});
