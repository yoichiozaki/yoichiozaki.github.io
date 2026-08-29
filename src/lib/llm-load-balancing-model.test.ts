import { describe, expect, it } from "vitest";
import {
  DEFAULT_CONFIG,
  DEFAULT_WORKLOAD,
  ROUTING_POLICIES,
  comparePolicies,
  createRng,
  generateWorkload,
  jainsFairness,
  percentile,
  simulateBatching,
  simulateLoadBalancing,
  simulatePrefixRouting,
  workloadSummary,
  type BatchJob,
  type LbConfig,
  type LbRequest,
  type RoutingPolicy,
} from "./llm-load-balancing-model";

const config: LbConfig = { ...DEFAULT_CONFIG };

function uniformRequests(count: number, promptTokens: number): LbRequest[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `R${index + 1}`,
    arrival: index * 2,
    promptTokens,
    prefixTokens: Math.floor(promptTokens * 0.8),
    outputTokens: 20,
    prefixId: `P${(index % 2) + 1}`,
    tenant: "T1",
    heavy: false,
  }));
}

describe("createRng", () => {
  it("is deterministic for a given seed", () => {
    const first = createRng(42);
    const second = createRng(42);
    const a = [first(), first(), first()];
    const b = [second(), second(), second()];
    expect(a).toEqual(b);
  });

  it("produces values inside [0, 1)", () => {
    const rng = createRng(7);
    for (let index = 0; index < 500; index += 1) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe("percentile", () => {
  it("interpolates between neighbours", () => {
    expect(percentile([1, 2, 3, 4], 0.5)).toBeCloseTo(2.5, 10);
    expect(percentile([10], 0.95)).toBe(10);
    expect(percentile([], 0.5)).toBe(0);
  });

  it("rejects out-of-range quantiles", () => {
    expect(() => percentile([1, 2], 1.5)).toThrow(RangeError);
  });
});

describe("jainsFairness", () => {
  it("is 1 for a perfectly even split and 1/n for a fully skewed split", () => {
    expect(jainsFairness([5, 5, 5, 5])).toBeCloseTo(1, 10);
    expect(jainsFairness([20, 0, 0, 0])).toBeCloseTo(0.25, 10);
  });
});

describe("generateWorkload", () => {
  it("is reproducible and monotonic in arrival time", () => {
    const first = generateWorkload(DEFAULT_WORKLOAD);
    const second = generateWorkload(DEFAULT_WORKLOAD);
    expect(first).toEqual(second);
    for (let index = 1; index < first.length; index += 1) {
      expect(first[index].arrival).toBeGreaterThanOrEqual(first[index - 1].arrival);
    }
  });

  it("keeps the reusable prefix shorter than the whole prompt", () => {
    for (const request of generateWorkload(DEFAULT_WORKLOAD)) {
      expect(request.prefixTokens).toBeLessThan(request.promptTokens);
      expect(request.outputTokens).toBeGreaterThan(0);
    }
  });

  it("produces a heavier tail as heavyRatio grows", () => {
    const light = workloadSummary(
      generateWorkload({ ...DEFAULT_WORKLOAD, heavyRatio: 0 }),
    );
    const heavy = workloadSummary(
      generateWorkload({ ...DEFAULT_WORKLOAD, heavyRatio: 0.5 }),
    );
    expect(heavy.meanPromptTokens).toBeGreaterThan(light.meanPromptTokens);
    expect(heavy.promptCv).toBeGreaterThan(light.promptCv);
  });

  it("rejects invalid parameters", () => {
    expect(() =>
      generateWorkload({ ...DEFAULT_WORKLOAD, arrivalRate: 0 }),
    ).toThrow(RangeError);
    expect(() => generateWorkload({ ...DEFAULT_WORKLOAD, count: 0 })).toThrow(
      RangeError,
    );
    expect(() =>
      generateWorkload({ ...DEFAULT_WORKLOAD, heavyRatio: 2 }),
    ).toThrow(RangeError);
  });
});

describe("simulateLoadBalancing", () => {
  const requests = generateWorkload(DEFAULT_WORKLOAD);

  it("completes every request for all policies", () => {
    for (const policy of ROUTING_POLICIES) {
      const result = simulateLoadBalancing(policy, requests, config);
      expect(result.completed).toBe(requests.length);
      expect(result.makespan).toBeLessThanOrEqual(config.maxTicks);
    }
  });

  it("is deterministic", () => {
    const first = simulateLoadBalancing("power-of-two", requests, config);
    const second = simulateLoadBalancing("power-of-two", requests, config);
    expect(first.ttftP95).toBe(second.ttftP95);
    expect(first.replicas.map((replica) => replica.assigned)).toEqual(
      second.replicas.map((replica) => replica.assigned),
    );
  });

  it("assigns exactly one replica per request", () => {
    for (const policy of ROUTING_POLICIES) {
      const result = simulateLoadBalancing(policy, requests, config);
      const assigned = result.replicas.reduce(
        (sum, replica) => sum + replica.assigned,
        0,
      );
      const served = result.replicas.reduce(
        (sum, replica) => sum + replica.served,
        0,
      );
      expect(assigned).toBe(requests.length);
      expect(served).toBe(requests.length);
    }
  });

  it("gives round robin an exactly even request count", () => {
    const result = simulateLoadBalancing("round-robin", requests, config);
    expect(result.assignedSpread).toBeLessThanOrEqual(1);
  });

  it("still leaves round robin behind least-outstanding on tail latency", () => {
    const roundRobin = simulateLoadBalancing("round-robin", requests, config);
    const leastOutstanding = simulateLoadBalancing(
      "least-outstanding",
      requests,
      config,
    );
    expect(leastOutstanding.ttftP95).toBeLessThan(roundRobin.ttftP95);
  });

  it("beats random with power-of-two choices on tail latency", () => {
    const random = simulateLoadBalancing("random", requests, config);
    const p2c = simulateLoadBalancing("power-of-two", requests, config);
    expect(p2c.ttftP95).toBeLessThan(random.ttftP95);
  });

  it("shows that an in-flight-only KV signal can herd work onto one replica", () => {
    // least-kv reads resident KV blocks only, so requests that are already
    // queued but not yet admitted are invisible and the router keeps piling on.
    const leastKv = simulateLoadBalancing("least-kv", requests, config);
    const leastOutstanding = simulateLoadBalancing(
      "least-outstanding",
      requests,
      config,
    );
    expect(leastKv.assignedSpread).toBeGreaterThan(leastOutstanding.assignedSpread);
    expect(leastKv.ttftP95).toBeGreaterThan(leastOutstanding.ttftP95);
  });

  it("raises the prefix cache hit rate with prefix-aware routing", () => {
    const leastOutstanding = simulateLoadBalancing(
      "least-outstanding",
      requests,
      config,
    );
    const prefixAware = simulateLoadBalancing("prefix-aware", requests, config);
    expect(prefixAware.cacheHitRate).toBeGreaterThan(leastOutstanding.cacheHitRate);
  });

  it("reports no cache credit when the prefix cache is disabled", () => {
    const result = simulateLoadBalancing("prefix-aware", requests, {
      ...config,
      prefixCacheEnabled: false,
    });
    expect(result.cacheHitRate).toBe(0);
  });

  it("keeps utilization and goodput inside their natural ranges", () => {
    for (const policy of ROUTING_POLICIES) {
      const result = simulateLoadBalancing(policy, requests, config);
      expect(result.goodput).toBeGreaterThanOrEqual(0);
      expect(result.goodput).toBeLessThanOrEqual(1);
      expect(result.cacheHitRate).toBeGreaterThanOrEqual(0);
      expect(result.cacheHitRate).toBeLessThanOrEqual(1);
      for (const replica of result.replicas) {
        expect(replica.utilization).toBeGreaterThanOrEqual(0);
        expect(replica.utilization).toBeLessThanOrEqual(1);
      }
    }
  });

  it("never exceeds the per-replica batch or KV budget", () => {
    // A single replica with uniform work: KV blocks bound the resident batch.
    const singleReplica: LbConfig = {
      ...config,
      replicas: 1,
      maxBatch: 3,
      kvBlocks: 400,
    };
    const result = simulateLoadBalancing(
      "round-robin",
      uniformRequests(12, 320),
      singleReplica,
    );
    expect(result.completed).toBe(12);
    expect(result.replicas[0].assigned).toBe(12);
  });

  it("degrades tail latency as the arrival rate approaches saturation", () => {
    const light = simulateLoadBalancing(
      "least-outstanding",
      generateWorkload({ ...DEFAULT_WORKLOAD, arrivalRate: 0.05 }),
      config,
    );
    const heavy = simulateLoadBalancing(
      "least-outstanding",
      generateWorkload({ ...DEFAULT_WORKLOAD, arrivalRate: 0.4 }),
      config,
    );
    expect(heavy.ttftP95).toBeGreaterThan(light.ttftP95);
    expect(heavy.goodput).toBeLessThan(light.goodput);
  });

  it("rejects impossible configurations", () => {
    expect(() =>
      simulateLoadBalancing("random", requests, { ...config, replicas: 0 }),
    ).toThrow(RangeError);
    expect(() =>
      simulateLoadBalancing("random", requests, { ...config, maxBatch: 0 }),
    ).toThrow(RangeError);
    expect(() =>
      simulateLoadBalancing("random", requests, {
        ...config,
        prefillTokensPerTick: 0,
      }),
    ).toThrow(RangeError);
  });
});

describe("comparePolicies", () => {
  it("returns one result per policy in order", () => {
    const results = comparePolicies(generateWorkload(DEFAULT_WORKLOAD), config);
    expect(results.map((result) => result.policy)).toEqual(ROUTING_POLICIES);
  });

  // These numbers are quoted verbatim in the blog post's comparison table.
  // If the model or the defaults change, update both together.
  it("matches the table published in the article", () => {
    const results = comparePolicies(generateWorkload(DEFAULT_WORKLOAD), config);
    const byPolicy = Object.fromEntries(
      results.map((result) => [result.policy, result]),
    );
    const expected: Record<
      RoutingPolicy,
      { ttftP95: number; goodput: number; cache: number; spread: number; tokens: number }
    > = {
      random: { ttftP95: 324.2, goodput: 88, cache: 38, spread: 10, tokens: 14.4 },
      "round-robin": { ttftP95: 84.3, goodput: 94, cache: 46, spread: 0, tokens: 15.1 },
      "least-outstanding": { ttftP95: 52.1, goodput: 98, cache: 39, spread: 10, tokens: 16.6 },
      "power-of-two": { ttftP95: 90.1, goodput: 94, cache: 37, spread: 8, tokens: 16.6 },
      "least-kv": { ttftP95: 559.0, goodput: 81, cache: 45, spread: 50, tokens: 12.5 },
      "prefix-aware": { ttftP95: 151.3, goodput: 91, cache: 67, spread: 11, tokens: 17.2 },
    };

    for (const policy of ROUTING_POLICIES) {
      const actual = byPolicy[policy];
      expect(actual.ttftP95).toBeCloseTo(expected[policy].ttftP95, 1);
      expect(Math.round(actual.goodput * 100)).toBe(expected[policy].goodput);
      expect(Math.round(actual.cacheHitRate * 100)).toBe(expected[policy].cache);
      expect(actual.assignedSpread).toBe(expected[policy].spread);
      expect(actual.outputTokensPerTick).toBeCloseTo(expected[policy].tokens, 1);
    }
  });

  it("ranks least-outstanding best on tail latency and least-kv worst", () => {
    const results = comparePolicies(generateWorkload(DEFAULT_WORKLOAD), config);
    const byTail = [...results].sort((left, right) => left.ttftP95 - right.ttftP95);
    expect(byTail[0].policy).toBe("least-outstanding");
    expect(byTail[byTail.length - 1].policy).toBe("least-kv");
  });

  it("gives prefix-aware the best cache hit rate and output throughput", () => {
    const results = comparePolicies(generateWorkload(DEFAULT_WORKLOAD), config);
    const bestCache = Math.max(...results.map((result) => result.cacheHitRate));
    const bestTokens = Math.max(
      ...results.map((result) => result.outputTokensPerTick),
    );
    const prefixAware = results.find(
      (result) => result.policy === "prefix-aware",
    );
    expect(prefixAware?.cacheHitRate).toBe(bestCache);
    expect(prefixAware?.outputTokensPerTick).toBe(bestTokens);
    // …but not the best tail.
    const bestTail = Math.min(...results.map((result) => result.ttftP95));
    expect(prefixAware?.ttftP95).toBeGreaterThan(bestTail);
  });

  it("converges when the pool is far from saturation", () => {
    const results = comparePolicies(
      generateWorkload({ ...DEFAULT_WORKLOAD, arrivalRate: 0.05 }),
      config,
    );
    const tails = results.map((result) => result.ttftP95);
    expect(Math.max(...tails) - Math.min(...tails)).toBeLessThan(20);
  });
});

describe("simulatePrefixRouting", () => {
  const trace = uniformRequests(10, 1000);

  it("emits one step per request with monotone cumulative prefill", () => {
    const steps = simulatePrefixRouting(trace, 3, 1);
    expect(steps).toHaveLength(trace.length);
    for (let index = 1; index < steps.length; index += 1) {
      expect(steps[index].cumulativeAwarePrefill).toBeGreaterThanOrEqual(
        steps[index - 1].cumulativeAwarePrefill,
      );
      expect(steps[index].cumulativeBaselinePrefill).toBeGreaterThanOrEqual(
        steps[index - 1].cumulativeBaselinePrefill,
      );
    }
  });

  it("charges the full prompt on a miss and only the fresh tail on a hit", () => {
    for (const step of simulatePrefixRouting(trace, 3, 1)) {
      const full = step.request.promptTokens;
      const fresh = step.request.promptTokens - step.request.prefixTokens;
      expect(step.awarePrefillTokens).toBe(step.awareHit ? fresh : full);
      expect(step.baselinePrefillTokens).toBe(step.baselineHit ? fresh : full);
    }
  });

  it("prefills strictly fewer tokens than the load-only baseline", () => {
    const steps = simulatePrefixRouting(trace, 3, 1);
    const last = steps[steps.length - 1];
    expect(last.cumulativeAwarePrefill).toBeLessThan(last.cumulativeBaselinePrefill);
  });

  it("keeps every LRU cache within its slot budget", () => {
    for (const step of simulatePrefixRouting(trace, 3, 2)) {
      for (const cache of step.awareCaches) expect(cache.length).toBeLessThanOrEqual(2);
      for (const cache of step.baselineCaches) {
        expect(cache.length).toBeLessThanOrEqual(2);
      }
    }
  });

  it("rejects degenerate pool or cache sizes", () => {
    expect(() => simulatePrefixRouting(trace, 1, 1)).toThrow(RangeError);
    expect(() => simulatePrefixRouting(trace, 3, 0)).toThrow(RangeError);
    expect(() => simulatePrefixRouting(trace, 3, 1, -1)).toThrow(RangeError);
  });

  it("reports exactly one reason per dispatch", () => {
    for (const step of simulatePrefixRouting(trace, 3, 1)) {
      expect(["affinity", "first-sight", "load-imbalance"]).toContain(
        step.awareReason,
      );
    }
  });

  it("only claims affinity when the prefix has a known owner", () => {
    const seen = new Set<string>();
    for (const step of simulatePrefixRouting(trace, 3, 1)) {
      if (step.awareReason === "affinity") {
        expect(seen.has(step.request.prefixId)).toBe(true);
      }
      if (step.awareReason === "first-sight") {
        expect(seen.has(step.request.prefixId)).toBe(false);
      }
      seen.add(step.request.prefixId);
    }
  });

  it("drops affinity once the load gap exceeds the threshold", () => {
    // A skewed trace: one popular prefix would otherwise pile onto one replica.
    const skewed = ["P1", "P2", "P3", "P1", "P1", "P1", "P1", "P2", "P1"].map(
      (prefixId, index) => ({
        id: `S${index + 1}`,
        arrival: index,
        prefixId,
        prefixTokens: 3000,
        promptTokens: 3200,
        outputTokens: 100,
        tenant: prefixId,
        heavy: false,
      }),
    );
    const steps = simulatePrefixRouting(skewed, 3, 1);
    const imbalanced = steps.filter(
      (step) => step.awareReason === "load-imbalance",
    );
    expect(imbalanced.length).toBeGreaterThan(0);
    for (const step of imbalanced) {
      const loadsBefore = [...step.awareLoads];
      loadsBefore[step.awareReplica] -= 1;
      expect(Math.max(...loadsBefore) - Math.min(...loadsBefore)).toBeGreaterThan(2);
    }
  });

  it("never lets the escape hatch pick a replica that is not least loaded", () => {
    for (const step of simulatePrefixRouting(trace, 3, 1)) {
      if (step.awareReason === "affinity") continue;
      const loadsBefore = [...step.awareLoads];
      loadsBefore[step.awareReplica] -= 1;
      expect(loadsBefore[step.awareReplica]).toBe(Math.min(...loadsBefore));
    }
  });

  // Section 6.1 of the article publishes these figures; keep them honest.
  it("pins the hit counts and prefill saving quoted in the article", () => {
    const articleTrace = (
      [
        ["P1", 4000, 180],
        ["P2", 3200, 150],
        ["P3", 2400, 210],
        ["P1", 4000, 120],
        ["P1", 4000, 260],
        ["P1", 4000, 140],
        ["P1", 4000, 160],
        ["P2", 3200, 130],
        ["P1", 4000, 200],
        ["P3", 2400, 110],
        ["P1", 4000, 170],
        ["P1", 4000, 150],
      ] as const
    ).map(([prefixId, prefixTokens, fresh], index) => ({
      id: `R${index + 1}`,
      arrival: index,
      prefixId,
      prefixTokens,
      promptTokens: prefixTokens + fresh,
      outputTokens: 120,
      tenant: prefixId,
      heavy: false,
    }));

    const steps = simulatePrefixRouting(articleTrace, 3, 1);
    const last = steps[steps.length - 1];

    expect(steps.filter((step) => step.baselineHit)).toHaveLength(4);
    expect(steps.filter((step) => step.awareHit)).toHaveLength(6);
    expect(
      steps.filter((step) => step.awareReason === "load-imbalance"),
    ).toHaveLength(2);

    // Every load-imbalance dispatch is a miss — the escape hatch has a cost.
    for (const step of steps) {
      if (step.awareReason === "load-imbalance") {
        expect(step.awareHit).toBe(false);
      }
    }

    expect(last.cumulativeBaselinePrefill).toBe(29180);
    expect(last.cumulativeAwarePrefill).toBe(21180);
    const reduction =
      (last.cumulativeBaselinePrefill - last.cumulativeAwarePrefill) /
      last.cumulativeBaselinePrefill;
    expect(reduction).toBeCloseTo(0.274, 3);
  });
});

describe("simulateBatching", () => {
  const jobs: BatchJob[] = [
    { id: "A", arrival: 0, prefillChunks: 2, decodeSteps: 6 },
    { id: "B", arrival: 0, prefillChunks: 1, decodeSteps: 3 },
    { id: "C", arrival: 1, prefillChunks: 3, decodeSteps: 4 },
    { id: "D", arrival: 2, prefillChunks: 1, decodeSteps: 8 },
    { id: "E", arrival: 4, prefillChunks: 2, decodeSteps: 3 },
    { id: "F", arrival: 6, prefillChunks: 1, decodeSteps: 5 },
  ];

  it("finishes every job in all three modes", () => {
    for (const mode of ["static", "continuous", "chunked"] as const) {
      const run = simulateBatching(mode, jobs, 3);
      const last = run.iterations[run.iterations.length - 1];
      expect(last.completed).toHaveLength(jobs.length);
      expect(run.finishedAt).toBeGreaterThan(0);
    }
  });

  // Section 7.2 of the article publishes these figures; keep them honest.
  it("pins the occupancy and stall counts quoted in the article", () => {
    const expected = {
      static: { occupancy: 57, stalled: 6 },
      continuous: { occupancy: 91, stalled: 8 },
      chunked: { occupancy: 93, stalled: 1 },
    } as const;

    for (const mode of ["static", "continuous", "chunked"] as const) {
      const run = simulateBatching(mode, jobs, 3);
      const total = run.iterations.reduce(
        (sum, iteration) => sum + iteration.slots.length,
        0,
      );
      const used = run.iterations.reduce(
        (sum, iteration) =>
          sum + iteration.slots.filter((slot) => slot.jobId !== null).length,
        0,
      );
      expect(Math.round((used / total) * 100)).toBe(expected[mode].occupancy);
      expect(run.stalledIterations).toBe(expected[mode].stalled);
    }
  });

  it("shows continuous batching trading more stalls for higher occupancy", () => {
    const staticRun = simulateBatching("static", jobs, 3);
    const continuousRun = simulateBatching("continuous", jobs, 3);
    const chunkedRun = simulateBatching("chunked", jobs, 3);
    // The counter-intuitive part: filling slots admits more prefills.
    expect(continuousRun.stalledIterations).toBeGreaterThan(
      staticRun.stalledIterations,
    );
    // Chunked prefill undoes that regression and goes further.
    expect(chunkedRun.stalledIterations).toBeLessThan(
      staticRun.stalledIterations,
    );
  });

  it("emits exactly one token per decoding sequence per iteration", () => {
    for (const mode of ["static", "continuous", "chunked"] as const) {
      const run = simulateBatching(mode, jobs, 3);
      for (const iteration of run.iterations) {
        const decoding = iteration.slots.filter(
          (slot) => slot.phase === "decode",
        ).length;
        expect(iteration.tokens).toBe(decoding);
      }
      const expectedTokens = jobs.reduce((sum, job) => sum + job.decodeSteps, 0);
      expect(run.totalTokens).toBe(expectedTokens);
    }
  });

  it("finishes sooner with continuous batching than with static batching", () => {
    const staticRun = simulateBatching("static", jobs, 3);
    const continuousRun = simulateBatching("continuous", jobs, 3);
    expect(continuousRun.finishedAt).toBeLessThan(staticRun.finishedAt);
  });

  it("removes decode stalls once prefill is chunked into the decode step", () => {
    const continuousRun = simulateBatching("continuous", jobs, 3);
    const chunkedRun = simulateBatching("chunked", jobs, 3);
    expect(continuousRun.stalledIterations).toBeGreaterThan(
      chunkedRun.stalledIterations,
    );
    expect(chunkedRun.finishedAt).toBeLessThanOrEqual(continuousRun.finishedAt);
  });

  it("never admits a new job into a static batch until the batch drains", () => {
    const run = simulateBatching("static", jobs, 3);
    const seen = new Set<string>();
    for (const iteration of run.iterations) {
      const active = iteration.slots
        .map((slot) => slot.jobId)
        .filter((id): id is string => id !== null);
      const newcomers = active.filter((id) => !seen.has(id));
      if (newcomers.length > 0 && seen.size > 0) {
        for (const id of seen) {
          expect(iteration.completed).toContain(id);
        }
      }
      for (const id of active) seen.add(id);
    }
  });

  it("refills a freed slot immediately under continuous batching", () => {
    const run = simulateBatching("continuous", jobs, 3);
    const seen = new Set<string>();
    let admittedWhileOthersRun = false;
    for (const iteration of run.iterations) {
      const active = iteration.slots
        .map((slot) => slot.jobId)
        .filter((id): id is string => id !== null);
      const newcomers = active.filter((id) => !seen.has(id));
      const unfinishedIncumbents = [...seen].filter(
        (id) => !iteration.completed.includes(id),
      );
      if (newcomers.length > 0 && unfinishedIncumbents.length > 0) {
        admittedWhileOthersRun = true;
      }
      for (const id of active) seen.add(id);
    }
    expect(admittedWhileOthersRun).toBe(true);
  });

  it("rejects invalid slot counts and job shapes", () => {
    expect(() => simulateBatching("continuous", jobs, 0)).toThrow(RangeError);
    expect(() =>
      simulateBatching(
        "continuous",
        [{ id: "X", arrival: 0, prefillChunks: 0, decodeSteps: 1 }],
        2,
      ),
    ).toThrow(RangeError);
  });
});
