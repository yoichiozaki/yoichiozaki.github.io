/**
 * A small, deterministic teaching model of request-level load balancing in front
 * of a pool of LLM inference replicas.
 *
 * Deliberate simplifications (surfaced in the UI so readers do not over-read the
 * numbers):
 *  - Discrete ticks. One tick is one engine iteration budget, not a wall-clock ms.
 *  - A replica performs either a prefill step or a decode step in a tick, never
 *    both. This reproduces "prefill blocks decode" head-of-line behaviour and is
 *    what chunked prefill exists to soften.
 *  - The prefix cache is modelled as an LRU set of prefix identifiers. Cached
 *    blocks are assumed to be free; only live sequences consume KV blocks.
 *  - The router dispatches on arrival (no central holding queue) and observes
 *    replica load without delay.
 */

export type RoutingPolicy =
  | "random"
  | "round-robin"
  | "least-outstanding"
  | "power-of-two"
  | "least-kv"
  | "prefix-aware";

export const ROUTING_POLICIES: RoutingPolicy[] = [
  "random",
  "round-robin",
  "least-outstanding",
  "power-of-two",
  "least-kv",
  "prefix-aware",
];

export type LbRequest = {
  id: string;
  /** Arrival tick. */
  arrival: number;
  promptTokens: number;
  outputTokens: number;
  /** Identifier of the reusable prompt prefix (system prompt + conversation head). */
  prefixId: string;
  /** Length of the reusable prefix, always <= promptTokens. */
  prefixTokens: number;
  tenant: string;
  /** True for the heavy tail of the request-size mixture. */
  heavy: boolean;
};

export type LbConfig = {
  replicas: number;
  /** Maximum number of sequences a replica keeps resident. */
  maxBatch: number;
  /** KV blocks available per replica. */
  kvBlocks: number;
  blockTokens: number;
  /** Prompt tokens a replica can prefill per tick. */
  prefillTokensPerTick: number;
  /** Output tokens per sequence per tick at batch size 1. */
  decodeTokensPerTick: number;
  /** Per-extra-sequence slowdown of the decode step. */
  batchPenalty: number;
  /** LRU capacity of the per-replica prefix cache, in prefix entries. */
  prefixCacheSlots: number;
  prefixCacheEnabled: boolean;
  /** prefix-aware: minimum prefixTokens/promptTokens ratio for affinity to win. */
  cacheThreshold: number;
  /** prefix-aware: absolute outstanding-load spread that disables affinity. */
  balanceAbsThreshold: number;
  /** prefix-aware: relative outstanding-load spread that gates the absolute check. */
  balanceRelThreshold: number;
  /** TTFT budget used to compute goodput, in ticks. */
  ttftSloTicks: number;
  /** Hard stop so a mis-parameterised run cannot spin. */
  maxTicks: number;
};

export const DEFAULT_CONFIG: LbConfig = {
  replicas: 4,
  maxBatch: 12,
  kvBlocks: 1400,
  blockTokens: 16,
  prefillTokensPerTick: 320,
  decodeTokensPerTick: 1,
  batchPenalty: 0.05,
  prefixCacheSlots: 3,
  prefixCacheEnabled: true,
  cacheThreshold: 0.3,
  balanceAbsThreshold: 6,
  balanceRelThreshold: 1.5,
  ttftSloTicks: 80,
  maxTicks: 20000,
};

export type WorkloadConfig = {
  seed: number;
  count: number;
  /** Expected arrivals per tick (Poisson process, exponential gaps). */
  arrivalRate: number;
  /** Share of requests drawn from the long-prompt / long-output mode. */
  heavyRatio: number;
  /** Number of distinct reusable prefixes. */
  prefixFamilies: number;
  tenants: number;
};

export const DEFAULT_WORKLOAD: WorkloadConfig = {
  seed: 20260825,
  count: 160,
  arrivalRate: 0.2,
  heavyRatio: 0.2,
  prefixFamilies: 6,
  tenants: 3,
};

/** mulberry32 — small, fast, and reproducible across engines. */
export function createRng(seed: number) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function exponential(rng: () => number, rate: number) {
  const u = Math.max(rng(), Number.EPSILON);
  return -Math.log(u) / rate;
}

function requireFinitePositive(value: number, name: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a finite positive number`);
  }
}

export function generateWorkload(workload: WorkloadConfig): LbRequest[] {
  requireFinitePositive(workload.arrivalRate, "arrivalRate");
  requireFinitePositive(workload.prefixFamilies, "prefixFamilies");
  requireFinitePositive(workload.tenants, "tenants");
  if (!Number.isInteger(workload.count) || workload.count <= 0) {
    throw new RangeError("count must be a positive integer");
  }
  if (workload.heavyRatio < 0 || workload.heavyRatio > 1) {
    throw new RangeError("heavyRatio must be within [0, 1]");
  }

  const rng = createRng(workload.seed);
  const requests: LbRequest[] = [];
  let clock = 0;

  for (let index = 0; index < workload.count; index += 1) {
    clock += exponential(rng, workload.arrivalRate);
    const heavy = rng() < workload.heavyRatio;
    const family = Math.floor(rng() * workload.prefixFamilies);
    const tenant = Math.floor(rng() * workload.tenants);

    // Two-mode mixture: short interactive turns plus a heavy tail of long
    // document-style prompts. The tail is what breaks request-count balancing.
    const prefixTokens = heavy
      ? 1400 + Math.floor(rng() * 1200)
      : 380 + Math.floor(rng() * 260);
    const freshTokens = heavy
      ? 220 + Math.floor(rng() * 400)
      : 40 + Math.floor(rng() * 120);
    const outputTokens = heavy
      ? 260 + Math.floor(rng() * 420)
      : 40 + Math.floor(rng() * 110);

    requests.push({
      id: `R${index + 1}`,
      arrival: Math.round(clock),
      promptTokens: prefixTokens + freshTokens,
      prefixTokens,
      outputTokens,
      prefixId: `P${family + 1}`,
      tenant: `T${tenant + 1}`,
      heavy,
    });
  }

  return requests;
}

export function workloadSummary(requests: LbRequest[]) {
  const prompts = requests.map((request) => request.promptTokens);
  const mean = prompts.reduce((sum, value) => sum + value, 0) / prompts.length;
  const variance =
    prompts.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    prompts.length;
  const sd = Math.sqrt(variance);
  return {
    count: requests.length,
    meanPromptTokens: mean,
    /** Coefficient of variation of the prompt size — the driver of queueing delay. */
    promptCv: mean === 0 ? 0 : sd / mean,
    maxPromptTokens: Math.max(...prompts),
    minPromptTokens: Math.min(...prompts),
    heavyShare: requests.filter((request) => request.heavy).length / requests.length,
  };
}

type LiveSequence = {
  request: LbRequest;
  /** Prompt tokens still to be prefilled after cache credit. */
  remainingPrefill: number;
  cachedTokens: number;
  generated: number;
  ttft: number | null;
};

type ReplicaState = {
  id: number;
  queue: LbRequest[];
  running: LiveSequence[];
  prefilling: LiveSequence | null;
  /** LRU of prefix IDs; most recently used last. */
  cache: string[];
  assigned: number;
  served: number;
  busyTicks: number;
  prefillTicks: number;
  decodeTicks: number;
};

export type ReplicaReport = {
  id: number;
  assigned: number;
  served: number;
  busyTicks: number;
  prefillTicks: number;
  decodeTicks: number;
  utilization: number;
};

export type LbResult = {
  policy: RoutingPolicy;
  completed: number;
  ttftP50: number;
  ttftP95: number;
  ttftMean: number;
  e2eP50: number;
  e2eP95: number;
  /** Share of completions whose TTFT met the configured budget. */
  goodput: number;
  /** Output tokens produced per tick over the whole run. */
  outputTokensPerTick: number;
  /** Share of prompt tokens answered from a warm prefix cache. */
  cacheHitRate: number;
  makespan: number;
  replicas: ReplicaReport[];
  /** max(assigned) - min(assigned) across replicas. */
  assignedSpread: number;
  /** Jain's fairness index over per-replica prompt-token load. */
  loadFairness: number;
  /** Sampled queue depth per replica for the timeline strip. */
  timeline: { tick: number; depths: number[] }[];
};

export function percentile(values: number[], q: number) {
  if (values.length === 0) return 0;
  if (!Number.isFinite(q) || q < 0 || q > 1) {
    throw new RangeError("q must be within [0, 1]");
  }
  const sorted = [...values].sort((left, right) => left - right);
  if (sorted.length === 1) return sorted[0];
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

export function jainsFairness(values: number[]) {
  if (values.length === 0) return 1;
  const sum = values.reduce((total, value) => total + value, 0);
  const squares = values.reduce((total, value) => total + value * value, 0);
  if (squares === 0) return 1;
  return (sum * sum) / (values.length * squares);
}

function outstanding(replica: ReplicaState) {
  return (
    replica.queue.length + replica.running.length + (replica.prefilling ? 1 : 0)
  );
}

function kvUsedBlocks(replica: ReplicaState, blockTokens: number) {
  const live = replica.prefilling
    ? [...replica.running, replica.prefilling]
    : replica.running;
  return live.reduce(
    (total, sequence) =>
      total +
      Math.ceil(
        (sequence.request.promptTokens + sequence.generated) / blockTokens,
      ),
    0,
  );
}

function argMin(replicas: ReplicaState[], score: (replica: ReplicaState) => number) {
  let best = replicas[0];
  let bestScore = score(best);
  for (const replica of replicas.slice(1)) {
    const value = score(replica);
    if (value < bestScore) {
      best = replica;
      bestScore = value;
    }
  }
  return best;
}

type RouterState = {
  cursor: number;
  /** Router-side approximate prefix ownership, updated on dispatch. */
  prefixOwner: Map<string, number>;
};

function selectReplica(
  policy: RoutingPolicy,
  request: LbRequest,
  replicas: ReplicaState[],
  router: RouterState,
  config: LbConfig,
  rng: () => number,
): ReplicaState {
  switch (policy) {
    case "random":
      return replicas[Math.floor(rng() * replicas.length)];

    case "round-robin": {
      const chosen = replicas[router.cursor % replicas.length];
      router.cursor += 1;
      return chosen;
    }

    case "least-outstanding":
      return argMin(replicas, outstanding);

    case "power-of-two": {
      const first = replicas[Math.floor(rng() * replicas.length)];
      const second = replicas[Math.floor(rng() * replicas.length)];
      return outstanding(first) <= outstanding(second) ? first : second;
    }

    case "least-kv":
      return argMin(
        replicas,
        (replica) =>
          kvUsedBlocks(replica, config.blockTokens) * 1000 + outstanding(replica),
      );

    case "prefix-aware": {
      const loads = replicas.map(outstanding);
      const maxLoad = Math.max(...loads);
      const minLoad = Math.min(...loads);
      const imbalanced =
        maxLoad - minLoad > config.balanceAbsThreshold &&
        maxLoad > minLoad * config.balanceRelThreshold;

      const matchRatio =
        request.promptTokens === 0
          ? 0
          : request.prefixTokens / request.promptTokens;
      const ownerId = router.prefixOwner.get(request.prefixId);

      let chosen: ReplicaState;
      if (
        !imbalanced &&
        ownerId !== undefined &&
        matchRatio > config.cacheThreshold
      ) {
        chosen = replicas[ownerId];
      } else {
        chosen = argMin(replicas, outstanding);
      }
      router.prefixOwner.set(request.prefixId, chosen.id);
      return chosen;
    }

    default: {
      const exhaustive: never = policy;
      throw new TypeError(`Unknown routing policy: ${String(exhaustive)}`);
    }
  }
}

function touchCache(replica: ReplicaState, prefixId: string, slots: number) {
  const existing = replica.cache.indexOf(prefixId);
  if (existing !== -1) replica.cache.splice(existing, 1);
  replica.cache.push(prefixId);
  while (replica.cache.length > slots) replica.cache.shift();
}

export function simulateLoadBalancing(
  policy: RoutingPolicy,
  requests: LbRequest[],
  config: LbConfig = DEFAULT_CONFIG,
): LbResult {
  if (!Number.isInteger(config.replicas) || config.replicas < 1) {
    throw new RangeError("replicas must be a positive integer");
  }
  if (!Number.isInteger(config.maxBatch) || config.maxBatch < 1) {
    throw new RangeError("maxBatch must be a positive integer");
  }
  requireFinitePositive(config.blockTokens, "blockTokens");
  requireFinitePositive(config.prefillTokensPerTick, "prefillTokensPerTick");
  requireFinitePositive(config.decodeTokensPerTick, "decodeTokensPerTick");
  if (config.batchPenalty < 0) {
    throw new RangeError("batchPenalty must be non-negative");
  }

  const rng = createRng(0x5eed ^ requests.length ^ policy.length);
  const replicas: ReplicaState[] = Array.from(
    { length: config.replicas },
    (_, id) => ({
      id,
      queue: [],
      running: [],
      prefilling: null,
      cache: [],
      assigned: 0,
      served: 0,
      busyTicks: 0,
      prefillTicks: 0,
      decodeTicks: 0,
    }),
  );
  const router: RouterState = { cursor: 0, prefixOwner: new Map() };

  const pending = [...requests].sort((left, right) => left.arrival - right.arrival);
  let nextArrival = 0;

  const ttfts: number[] = [];
  const e2es: number[] = [];
  const timeline: { tick: number; depths: number[] }[] = [];
  const promptTokensByReplica = new Array<number>(config.replicas).fill(0);
  let cachedTokenTotal = 0;
  let promptTokenTotal = 0;
  let outputTokenTotal = 0;
  let completed = 0;
  let makespan = 0;

  const sampleEvery = Math.max(
    1,
    Math.round((pending[pending.length - 1]?.arrival ?? 100) / 60),
  );

  for (let tick = 0; tick <= config.maxTicks; tick += 1) {
    while (nextArrival < pending.length && pending[nextArrival].arrival <= tick) {
      const request = pending[nextArrival];
      nextArrival += 1;
      const replica = selectReplica(policy, request, replicas, router, config, rng);
      replica.queue.push(request);
      replica.assigned += 1;
      promptTokensByReplica[replica.id] += request.promptTokens;
    }

    for (const replica of replicas) {
      // 1. Admission: one prefill at a time, bounded by batch slots and KV blocks.
      if (replica.prefilling === null && replica.queue.length > 0) {
        const head = replica.queue[0];
        const blocksNeeded = Math.ceil(head.promptTokens / config.blockTokens);
        const used = kvUsedBlocks(replica, config.blockTokens);
        if (
          replica.running.length < config.maxBatch &&
          used + blocksNeeded <= config.kvBlocks
        ) {
          replica.queue.shift();
          const warm =
            config.prefixCacheEnabled && replica.cache.includes(head.prefixId);
          const cachedTokens = warm ? head.prefixTokens : 0;
          replica.prefilling = {
            request: head,
            remainingPrefill: head.promptTokens - cachedTokens,
            cachedTokens,
            generated: 0,
            ttft: null,
          };
          cachedTokenTotal += cachedTokens;
          promptTokenTotal += head.promptTokens;
        }
      }

      // 2. A tick is either a prefill step or a decode step, never both.
      if (replica.prefilling !== null) {
        const sequence = replica.prefilling;
        sequence.remainingPrefill -= config.prefillTokensPerTick;
        replica.busyTicks += 1;
        replica.prefillTicks += 1;
        if (sequence.remainingPrefill <= 0) {
          sequence.remainingPrefill = 0;
          sequence.ttft = tick + 1 - sequence.request.arrival;
          ttfts.push(sequence.ttft);
          if (config.prefixCacheEnabled) {
            touchCache(replica, sequence.request.prefixId, config.prefixCacheSlots);
          }
          replica.running.push(sequence);
          replica.prefilling = null;
        }
      } else if (replica.running.length > 0) {
        const batch = replica.running.length;
        const perSequence =
          config.decodeTokensPerTick / (1 + config.batchPenalty * (batch - 1));
        replica.busyTicks += 1;
        replica.decodeTicks += 1;
        const finished: LiveSequence[] = [];
        for (const sequence of replica.running) {
          const before = sequence.generated;
          sequence.generated = before + perSequence;
          outputTokenTotal += Math.min(
            perSequence,
            Math.max(0, sequence.request.outputTokens - before),
          );
          if (sequence.generated >= sequence.request.outputTokens) {
            finished.push(sequence);
          }
        }
        for (const sequence of finished) {
          replica.running.splice(replica.running.indexOf(sequence), 1);
          replica.served += 1;
          completed += 1;
          e2es.push(tick + 1 - sequence.request.arrival);
          makespan = tick + 1;
        }
      }
    }

    if (tick % sampleEvery === 0) {
      timeline.push({
        tick,
        depths: replicas.map((replica) => outstanding(replica)),
      });
    }

    const idle =
      nextArrival >= pending.length &&
      replicas.every(
        (replica) =>
          replica.queue.length === 0 &&
          replica.running.length === 0 &&
          replica.prefilling === null,
      );
    if (idle) break;
  }

  const effectiveMakespan = Math.max(makespan, 1);
  return {
    policy,
    completed,
    ttftP50: percentile(ttfts, 0.5),
    ttftP95: percentile(ttfts, 0.95),
    ttftMean:
      ttfts.length === 0
        ? 0
        : ttfts.reduce((sum, value) => sum + value, 0) / ttfts.length,
    e2eP50: percentile(e2es, 0.5),
    e2eP95: percentile(e2es, 0.95),
    goodput:
      ttfts.length === 0
        ? 0
        : ttfts.filter((value) => value <= config.ttftSloTicks).length /
          ttfts.length,
    outputTokensPerTick: outputTokenTotal / effectiveMakespan,
    cacheHitRate: promptTokenTotal === 0 ? 0 : cachedTokenTotal / promptTokenTotal,
    makespan: effectiveMakespan,
    replicas: replicas.map((replica) => ({
      id: replica.id,
      assigned: replica.assigned,
      served: replica.served,
      busyTicks: replica.busyTicks,
      prefillTicks: replica.prefillTicks,
      decodeTicks: replica.decodeTicks,
      utilization: replica.busyTicks / effectiveMakespan,
    })),
    assignedSpread:
      Math.max(...replicas.map((replica) => replica.assigned)) -
      Math.min(...replicas.map((replica) => replica.assigned)),
    loadFairness: jainsFairness(promptTokensByReplica),
    timeline,
  };
}

export function comparePolicies(
  requests: LbRequest[],
  config: LbConfig = DEFAULT_CONFIG,
  policies: RoutingPolicy[] = ROUTING_POLICIES,
) {
  return policies.map((policy) => simulateLoadBalancing(policy, requests, config));
}

// ── Prefix-cache routing walkthrough ────────────────────────────────────────

export type PrefixStep = {
  index: number;
  request: LbRequest;
  /** Replica chosen by the load-only baseline. */
  baselineReplica: number;
  baselineHit: boolean;
  baselinePrefillTokens: number;
  /** Replica chosen by prefix-aware routing. */
  awareReplica: number;
  awareHit: boolean;
  awarePrefillTokens: number;
  /** Why the prefix-aware router did not use affinity, if it did not. */
  awareReason: "affinity" | "first-sight" | "load-imbalance";
  baselineCaches: string[][];
  awareCaches: string[][];
  baselineLoads: number[];
  awareLoads: number[];
  cumulativeBaselinePrefill: number;
  cumulativeAwarePrefill: number;
};

/**
 * Side-by-side walkthrough of least-outstanding vs prefix-aware dispatch over a
 * fixed request trace. Load is modelled as a simple in-flight counter that
 * drains one unit per dispatch, which is enough to show the affinity/balance
 * tension without the full engine model.
 */
export function simulatePrefixRouting(
  requests: LbRequest[],
  replicaCount: number,
  cacheSlots: number,
  loadSpreadThreshold = 2,
): PrefixStep[] {
  if (!Number.isInteger(replicaCount) || replicaCount < 2) {
    throw new RangeError("replicaCount must be an integer >= 2");
  }
  if (!Number.isInteger(cacheSlots) || cacheSlots < 1) {
    throw new RangeError("cacheSlots must be a positive integer");
  }
  if (!Number.isInteger(loadSpreadThreshold) || loadSpreadThreshold < 0) {
    throw new RangeError("loadSpreadThreshold must be a non-negative integer");
  }

  const baselineCaches: string[][] = Array.from({ length: replicaCount }, () => []);
  const awareCaches: string[][] = Array.from({ length: replicaCount }, () => []);
  const baselineLoads = new Array<number>(replicaCount).fill(0);
  const awareLoads = new Array<number>(replicaCount).fill(0);
  const owner = new Map<string, number>();

  const push = (cache: string[], prefixId: string) => {
    const at = cache.indexOf(prefixId);
    if (at !== -1) cache.splice(at, 1);
    cache.push(prefixId);
    while (cache.length > cacheSlots) cache.shift();
  };

  const leastLoaded = (loads: number[]) => {
    let best = 0;
    for (let index = 1; index < loads.length; index += 1) {
      if (loads[index] < loads[best]) best = index;
    }
    return best;
  };

  let cumulativeBaselinePrefill = 0;
  let cumulativeAwarePrefill = 0;
  const steps: PrefixStep[] = [];

  requests.forEach((request, index) => {
    const baselineReplica = leastLoaded(baselineLoads);
    const baselineHit = baselineCaches[baselineReplica].includes(request.prefixId);
    const baselinePrefill = baselineHit
      ? request.promptTokens - request.prefixTokens
      : request.promptTokens;
    baselineLoads[baselineReplica] += 1;
    push(baselineCaches[baselineReplica], request.prefixId);
    cumulativeBaselinePrefill += baselinePrefill;

    const loadSpread = Math.max(...awareLoads) - Math.min(...awareLoads);
    const ownerId = owner.get(request.prefixId);
    const reason: PrefixStep["awareReason"] =
      ownerId === undefined
        ? "first-sight"
        : loadSpread > loadSpreadThreshold
          ? "load-imbalance"
          : "affinity";
    const awareReplica =
      reason === "affinity" ? (ownerId as number) : leastLoaded(awareLoads);
    const awareHit = awareCaches[awareReplica].includes(request.prefixId);
    const awarePrefill = awareHit
      ? request.promptTokens - request.prefixTokens
      : request.promptTokens;
    awareLoads[awareReplica] += 1;
    push(awareCaches[awareReplica], request.prefixId);
    owner.set(request.prefixId, awareReplica);
    cumulativeAwarePrefill += awarePrefill;

    steps.push({
      index,
      request,
      baselineReplica,
      baselineHit,
      baselinePrefillTokens: baselinePrefill,
      awareReplica,
      awareHit,
      awarePrefillTokens: awarePrefill,
      awareReason: reason,
      baselineCaches: baselineCaches.map((cache) => [...cache]),
      awareCaches: awareCaches.map((cache) => [...cache]),
      baselineLoads: [...baselineLoads],
      awareLoads: [...awareLoads],
      cumulativeBaselinePrefill,
      cumulativeAwarePrefill,
    });
  });

  return steps;
}

// ── Engine-side batching walkthrough ────────────────────────────────────────

export type BatchingMode = "static" | "continuous" | "chunked";

export type BatchJob = {
  id: string;
  arrival: number;
  /** Prefill work expressed in chunk units. */
  prefillChunks: number;
  /** Decode steps required after prefill completes. */
  decodeSteps: number;
};

export type SlotView = {
  jobId: string | null;
  phase: "prefill" | "decode" | "idle";
};

export type BatchingIteration = {
  index: number;
  slots: SlotView[];
  waiting: string[];
  completed: string[];
  /** True when the iteration produced no output tokens at all. */
  stalled: boolean;
  /** Output tokens emitted in this iteration (one per decoding sequence). */
  tokens: number;
};

export type BatchingRun = {
  mode: BatchingMode;
  iterations: BatchingIteration[];
  /** Iteration index at which every job has finished, or -1 if unfinished. */
  finishedAt: number;
  totalTokens: number;
  stalledIterations: number;
};

type BatchSlot = {
  job: BatchJob;
  prefillLeft: number;
  decodeLeft: number;
};

/**
 * Compares three engine scheduling styles over one job trace:
 *  - "static": a batch is admitted together and no slot is reused until the
 *    whole batch drains.
 *  - "continuous": slots are refilled at every iteration, but a pending prefill
 *    takes the whole iteration, so decode stalls while it runs.
 *  - "chunked": prefill is split into chunk-sized pieces that ride along with
 *    decode in the same iteration.
 */
export function simulateBatching(
  mode: BatchingMode,
  jobs: BatchJob[],
  slotCount: number,
  maxIterations = 60,
): BatchingRun {
  if (!Number.isInteger(slotCount) || slotCount < 1) {
    throw new RangeError("slotCount must be a positive integer");
  }
  if (!Number.isInteger(maxIterations) || maxIterations < 1) {
    throw new RangeError("maxIterations must be a positive integer");
  }
  for (const job of jobs) {
    if (job.prefillChunks < 1 || job.decodeSteps < 1) {
      throw new RangeError(`job ${job.id} must have positive prefill and decode work`);
    }
  }

  const ordered = [...jobs].sort((left, right) => left.arrival - right.arrival);
  const slots: (BatchSlot | null)[] = new Array(slotCount).fill(null);
  const waiting: BatchJob[] = [];
  const completed: string[] = [];
  const iterations: BatchingIteration[] = [];
  let nextArrival = 0;
  let totalTokens = 0;
  let stalledIterations = 0;
  let finishedAt = -1;

  for (let index = 0; index < maxIterations; index += 1) {
    while (nextArrival < ordered.length && ordered[nextArrival].arrival <= index) {
      waiting.push(ordered[nextArrival]);
      nextArrival += 1;
    }

    const batchEmpty = slots.every((slot) => slot === null);
    const canAdmit = mode === "static" ? batchEmpty : true;
    if (canAdmit) {
      for (let slotIndex = 0; slotIndex < slotCount; slotIndex += 1) {
        if (slots[slotIndex] !== null || waiting.length === 0) continue;
        const job = waiting.shift() as BatchJob;
        slots[slotIndex] = {
          job,
          prefillLeft: job.prefillChunks,
          decodeLeft: job.decodeSteps,
        };
      }
    }

    const prefillPending = slots.some(
      (slot) => slot !== null && slot.prefillLeft > 0,
    );
    // Non-chunked engines run a prefill-only iteration; chunked prefill mixes.
    const prefillOnly = mode !== "chunked" && prefillPending;

    let tokens = 0;
    const view: SlotView[] = slots.map((slot) => {
      if (slot === null) return { jobId: null, phase: "idle" };
      if (slot.prefillLeft > 0) {
        slot.prefillLeft -= 1;
        return { jobId: slot.job.id, phase: "prefill" };
      }
      if (prefillOnly) return { jobId: slot.job.id, phase: "idle" };
      slot.decodeLeft -= 1;
      tokens += 1;
      return { jobId: slot.job.id, phase: "decode" };
    });

    for (let slotIndex = 0; slotIndex < slotCount; slotIndex += 1) {
      const slot = slots[slotIndex];
      if (slot !== null && slot.prefillLeft === 0 && slot.decodeLeft === 0) {
        completed.push(slot.job.id);
        slots[slotIndex] = null;
      }
    }

    totalTokens += tokens;
    if (tokens === 0) stalledIterations += 1;

    iterations.push({
      index,
      slots: view,
      waiting: waiting.map((job) => job.id),
      completed: [...completed],
      stalled: tokens === 0,
      tokens,
    });

    if (
      finishedAt === -1 &&
      completed.length === ordered.length &&
      waiting.length === 0
    ) {
      finishedAt = index;
      break;
    }
  }

  return { mode, iterations, finishedAt, totalTokens, stalledIterations };
}

// ── Stale-signal / herding walkthrough ──────────────────────────────────────

export type StalenessPolicy =
  | "least-outstanding"
  | "in-flight-aware"
  | "power-of-two"
  | "in-flight-aware-p2c";

export const STALENESS_POLICIES: StalenessPolicy[] = [
  "least-outstanding",
  "in-flight-aware",
  "power-of-two",
  "in-flight-aware-p2c",
];

export type StalenessConfig = {
  replicas: number;
  routers: number;
  /** Ticks between metric scrapes. 1 means a perfectly fresh view. */
  scrapeIntervalTicks: number;
  arrivalsPerTick: number;
  /** Ticks a request occupies a replica slot. */
  serviceTicks: number;
  horizonTicks: number;
  /** Spread scrapes evenly across the interval instead of firing them together. */
  staggerScrapes: boolean;
  seed: number;
};

export const DEFAULT_STALENESS_CONFIG: StalenessConfig = {
  replicas: 5,
  routers: 4,
  scrapeIntervalTicks: 10,
  arrivalsPerTick: 2,
  serviceTicks: 14,
  horizonTicks: 90,
  staggerScrapes: false,
  seed: 20260826,
};

export type StalenessTick = {
  tick: number;
  /** Actual outstanding requests per replica after this tick's dispatches. */
  trueLoads: number[];
  /** What each router believed when it decided, including its own corrections. */
  effectiveViews: number[][];
  /** Router index that handled each arrival, parallel to `placements`. */
  arrivalRouters: number[];
  /**
   * For two-choice policies, the pair of replicas actually probed for each
   * arrival; `null` when the policy scanned every replica.
   */
  sampledReplicas: (number[] | null)[];
  scrapedRouters: number[];
  /** Replica index chosen for each arrival in this tick. */
  placements: number[];
  spread: number;
};

export type StalenessResult = {
  policy: StalenessPolicy;
  ticks: StalenessTick[];
  maxSpread: number;
  meanSpread: number;
  /** Mean absolute tick-over-tick change in spread — the size of the limit cycle. */
  oscillation: number;
  /** Share of ticks in which every arrival landed on the same replica. */
  pileUpRate: number;
};

function pickLeast(view: number[], rng: () => number) {
  let bestValue = view[0];
  for (let index = 1; index < view.length; index += 1) {
    if (view[index] < bestValue) bestValue = view[index];
  }
  // Deterministic ties would hide herding behind an implementation detail, so
  // break them uniformly at random the way real least-request policies do.
  const tied: number[] = [];
  for (let index = 0; index < view.length; index += 1) {
    if (view[index] === bestValue) tied.push(index);
  }
  return tied[Math.floor(rng() * tied.length)];
}

/**
 * Models what happens when routers decide at request cadence but observe load
 * at scrape cadence. Four policies span a 2x2: whether the router corrects its
 * stale view with its own in-flight dispatches, and whether it samples two
 * candidates instead of scanning them all.
 */
export function simulateStaleness(
  policy: StalenessPolicy,
  config: StalenessConfig = DEFAULT_STALENESS_CONFIG,
): StalenessResult {
  if (!Number.isInteger(config.replicas) || config.replicas < 2) {
    throw new RangeError("replicas must be an integer >= 2");
  }
  if (!Number.isInteger(config.routers) || config.routers < 1) {
    throw new RangeError("routers must be a positive integer");
  }
  if (
    !Number.isInteger(config.scrapeIntervalTicks) ||
    config.scrapeIntervalTicks < 1
  ) {
    throw new RangeError("scrapeIntervalTicks must be a positive integer");
  }
  if (!Number.isInteger(config.serviceTicks) || config.serviceTicks < 1) {
    throw new RangeError("serviceTicks must be a positive integer");
  }
  if (!Number.isInteger(config.arrivalsPerTick) || config.arrivalsPerTick < 1) {
    throw new RangeError("arrivalsPerTick must be a positive integer");
  }
  if (!Number.isInteger(config.horizonTicks) || config.horizonTicks < 1) {
    throw new RangeError("horizonTicks must be a positive integer");
  }

  const rng = createRng(config.seed ^ policy.length);
  const usesInFlight =
    policy === "in-flight-aware" || policy === "in-flight-aware-p2c";
  const usesTwoChoices =
    policy === "power-of-two" || policy === "in-flight-aware-p2c";

  const trueLoads = new Array<number>(config.replicas).fill(0);
  const completions = new Map<number, number[]>();
  const believed = Array.from({ length: config.routers }, () =>
    new Array<number>(config.replicas).fill(0),
  );
  const dispatched = Array.from({ length: config.routers }, () =>
    new Array<number>(config.replicas).fill(0),
  );

  const offsets = Array.from({ length: config.routers }, (_, router) =>
    config.staggerScrapes
      ? Math.floor((router * config.scrapeIntervalTicks) / config.routers)
      : 0,
  );

  const ticks: StalenessTick[] = [];
  let arrivalCounter = 0;

  for (let tick = 0; tick < config.horizonTicks; tick += 1) {
    for (const replica of completions.get(tick) ?? []) {
      trueLoads[replica] -= 1;
    }
    completions.delete(tick);

    const scrapedRouters: number[] = [];
    for (let router = 0; router < config.routers; router += 1) {
      if ((tick + offsets[router]) % config.scrapeIntervalTicks === 0) {
        believed[router] = [...trueLoads];
        dispatched[router] = new Array<number>(config.replicas).fill(0);
        scrapedRouters.push(router);
      }
    }

    const placements: number[] = [];
    const effectiveViews: number[][] = [];
    const arrivalRouters: number[] = [];
    const sampledReplicas: (number[] | null)[] = [];
    for (let index = 0; index < config.arrivalsPerTick; index += 1) {
      const router = arrivalCounter % config.routers;
      arrivalCounter += 1;
      arrivalRouters.push(router);
      const view = believed[router].map((value, replica) =>
        usesInFlight ? value + dispatched[router][replica] : value,
      );

      let chosen: number;
      let sampled: number[] | null = null;
      if (usesTwoChoices) {
        const first = Math.floor(rng() * config.replicas);
        const second = Math.floor(rng() * config.replicas);
        sampled = [first, second];
        chosen = view[first] <= view[second] ? first : second;
      } else {
        chosen = pickLeast(view, rng);
      }
      sampledReplicas.push(sampled);

      dispatched[router][chosen] += 1;
      trueLoads[chosen] += 1;
      const finish = tick + config.serviceTicks;
      const bucket = completions.get(finish);
      if (bucket) bucket.push(chosen);
      else completions.set(finish, [chosen]);

      placements.push(chosen);
      effectiveViews.push(view);
    }

    const spread = Math.max(...trueLoads) - Math.min(...trueLoads);
    ticks.push({
      tick,
      trueLoads: [...trueLoads],
      effectiveViews,
      arrivalRouters,
      sampledReplicas,
      scrapedRouters,
      placements,
      spread,
    });
  }

  const spreads = ticks.map((entry) => entry.spread);
  let oscillation = 0;
  for (let index = 1; index < spreads.length; index += 1) {
    oscillation += Math.abs(spreads[index] - spreads[index - 1]);
  }
  const pileUps = ticks.filter(
    (entry) =>
      entry.placements.length > 1 &&
      entry.placements.every((value) => value === entry.placements[0]),
  ).length;

  return {
    policy,
    ticks,
    maxSpread: Math.max(...spreads),
    meanSpread: spreads.reduce((sum, value) => sum + value, 0) / spreads.length,
    oscillation: spreads.length > 1 ? oscillation / (spreads.length - 1) : 0,
    pileUpRate: pileUps / ticks.length,
  };
}

export function compareStaleness(
  config: StalenessConfig = DEFAULT_STALENESS_CONFIG,
) {
  return STALENESS_POLICIES.map((policy) => simulateStaleness(policy, config));
}
