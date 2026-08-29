export type CpuAlgorithm = "fcfs" | "sjf" | "srtf" | "rr";

export type CpuTask = {
  id: string;
  arrival: number;
  burst: number;
};

export type CpuStepEvent =
  | "initial"
  | "dispatch"
  | "continue"
  | "preempt"
  | "quantum"
  | "complete"
  | "idle";

/** Post-transition snapshot after [intervalStart, intervalEnd). */
export type CpuStep = {
  time: number;
  /** @deprecated Prefer executedTask. */
  running: string | null;
  /** @deprecated Prefer events. */
  event: CpuStepEvent;
  executedTask: string | null;
  intervalStart: number | null;
  intervalEnd: number | null;
  ready: string[];
  remaining: Record<string, number>;
  completed: string[];
  events: CpuStepEvent[];
};

export type CpuSlice = {
  taskId: string | null;
  start: number;
  end: number;
};

export type CpuTaskMetrics = {
  completion: number;
  turnaround: number;
  waiting: number;
  response: number;
};

export type CpuSimulation = {
  steps: CpuStep[];
  slices: CpuSlice[];
  metrics: Record<string, CpuTaskMetrics>;
  averageWaiting: number;
  averageResponse: number;
  finishTime: number;
};

export type FairAlgorithm = "fifo" | "round-robin" | "shortest-request" | "sfq";

export type FairClient = {
  id: string;
  requestCost: number;
  requestCount: number;
  weight: number;
  /** Independent logical arrival; all configured requests arrive as one batch. */
  joinAfter: number;
};

export type FairRequest = {
  /** Opaque globally unique simulator ID. */
  id: string;
  clientId: string;
  cost: number;
  arrivalOrder: number;
};

export type FairDispatchStep = {
  index: number;
  logicalTime: number;
  chosen: FairRequest | null;
  /** Post-admission queues. */
  queues: Record<string, FairRequest[]>;
  metersBefore: Record<string, number>;
  meters: Record<string, number>;
  normalizedService: Record<string, number>;
  dispatchedCount: Record<string, number>;
  /** Eligible tenant IDs immediately before the included admission. */
  fairnessCohort: string[];
  /** Service since this exact cohort became common-backlogged. */
  fairnessService: Record<string, number>;
  virtualTime: number;
  joinedClients: string[];
  idleReset: boolean;
};

export type FairSimulation = {
  steps: FairDispatchStep[];
  sequence: FairRequest[];
};

export type ExactSfqRequest = {
  id: string;
  chargeTicks: number;
};

export type ExactSfqState = {
  virtualTimeTicks: number;
  meterTicks: Record<string, number>;
  queues: Record<string, ExactSfqRequest[]>;
};

export type ExactSfqDispatch = {
  clientId: string;
  request: ExactSfqRequest;
  startTicks: number;
  finishTicks: number;
  idleReset: boolean;
};

const MAX_SIMULATION_TICKS = 1_000_000;
const MAX_SNAPSHOT_REFERENCES = 2_000_000;

function validateIds(ids: string[], kind: string) {
  if (ids.some((id) => typeof id !== "string" || id.trim() === "")) {
    throw new TypeError(`${kind} IDs must be non-empty strings`);
  }
  if (new Set(ids).size !== ids.length) {
    throw new TypeError(`${kind} IDs must be unique`);
  }
}

function finiteFloor(value: number, name: string, minimum: number) {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  const normalized = Math.floor(value);
  if (!Number.isSafeInteger(normalized) || normalized < minimum) {
    throw new RangeError(
      `${name} must normalize to a safe integer >= ${minimum}`,
    );
  }
  return normalized;
}

function safeAdd(left: number, right: number) {
  const value = left + right;
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(
      "Scheduling counter exceeds JavaScript's safe-integer range",
    );
  }
  return value;
}

function safeMultiply(left: number, right: number) {
  const value = left * right;
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(
      "Scheduling charge exceeds JavaScript's safe-integer range",
    );
  }
  return value;
}

export function workConservingHorizon(
  batches: Array<{ arrival: number; work: number }>,
) {
  let time = 0;
  const ordered = [...batches].sort(
    (left, right) => left.arrival - right.arrival,
  );
  for (const batch of ordered) {
    time = Math.max(time, batch.arrival);
    time = safeAdd(time, batch.work);
  }
  return time;
}

function maximumOf(values: Iterable<number>, fallback = 0) {
  let result = fallback;
  for (const value of values) result = Math.max(result, value);
  return result;
}

function minimumOf(values: Iterable<number>) {
  let result = Number.POSITIVE_INFINITY;
  for (const value of values) result = Math.min(result, value);
  return result;
}

export function sameIds(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function compareIds(left: string, right: string) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function appendSlice(
  slices: CpuSlice[],
  taskId: string | null,
  start: number,
  end: number,
) {
  const previous = slices.at(-1);
  if (previous?.taskId === taskId && previous.end === start) previous.end = end;
  else slices.push({ taskId, start, end });
}

/**
 * One unit-speed CPU with integer ticks and zero switch cost. SJF/SRTF ties use
 * arrival then configured input order. At an RR boundary, new arrivals enter
 * before the expired task is appended to the queue tail.
 */
export function simulateCpu(
  tasks: CpuTask[],
  algorithm: CpuAlgorithm,
  quantum = 2,
): CpuSimulation {
  if (!(algorithm === "fcfs" || algorithm === "sjf" || algorithm === "srtf" || algorithm === "rr")) {
    throw new TypeError(`Unsupported CPU algorithm: ${String(algorithm)}`);
  }
  const safeQuantum = finiteFloor(quantum, "quantum", 1);
  if (tasks.length === 0) {
    return {
      steps: [],
      slices: [],
      metrics: {},
      averageWaiting: 0,
      averageResponse: 0,
      finishTime: 0,
    };
  }

  validateIds(tasks.map((task) => task.id), "Task");
  const normalized = tasks.map((task, inputIndex) => ({
    ...task,
    inputIndex,
    arrival: finiteFloor(task.arrival, `${task.id}.arrival`, 0),
    burst: finiteFloor(task.burst, `${task.id}.burst`, 1),
  }));
  const finishHorizon = workConservingHorizon(
    normalized.map((task) => ({ arrival: task.arrival, work: task.burst })),
  );
  if (finishHorizon > MAX_SIMULATION_TICKS) {
    throw new RangeError(
      `CPU simulation exceeds ${MAX_SIMULATION_TICKS} ticks`,
    );
  }
  const cpuSnapshotCells = safeMultiply(normalized.length, finishHorizon);
  if (cpuSnapshotCells > MAX_SNAPSHOT_REFERENCES) {
    throw new RangeError(
      `CPU snapshots exceed ${MAX_SNAPSHOT_REFERENCES} task-tick cells`,
    );
  }

  const byId = new Map(normalized.map((task) => [task.id, task]));
  const remaining = new Map(normalized.map((task) => [task.id, task.burst]));
  const firstStart = new Map<string, number>();
  const completion = new Map<string, number>();
  const slices: CpuSlice[] = [];
  const steps: CpuStep[] = [];
  const rrQueue: string[] = [];
  const rrKnown = new Set<string>();
  let rrUsed = 0;
  let time = 0;
  let current: string | null = null;
  let previousExecuted: string | null = null;

  const inputCompare = (left: string, right: string) =>
    byId.get(left)!.inputIndex - byId.get(right)!.inputIndex;
  const remainingSnapshot = () =>
    Object.fromEntries(
      normalized.map((task) => [task.id, remaining.get(task.id) ?? 0]),
    );
  const completedIds = () =>
    normalized
      .filter((task) => (remaining.get(task.id) ?? 0) === 0)
      .map((task) => task.id);
  const available = (at: number, excluded: string | null = null) =>
    normalized
      .filter(
        (task) =>
          task.arrival <= at &&
          (remaining.get(task.id) ?? 0) > 0 &&
          task.id !== excluded,
      )
      .map((task) => task.id);
  const addRrArrivals = (fromExclusive: number, throughInclusive: number) => {
    const arrivals = normalized
      .filter(
        (task) =>
          task.arrival > fromExclusive &&
          task.arrival <= throughInclusive &&
          !rrKnown.has(task.id) &&
          (remaining.get(task.id) ?? 0) > 0,
      )
      .sort(
        (left, right) =>
          left.arrival - right.arrival || left.inputIndex - right.inputIndex,
      );
    for (const task of arrivals) {
      rrKnown.add(task.id);
      rrQueue.push(task.id);
    }
  };

  if (algorithm === "rr") addRrArrivals(-1, 0);
  steps.push({
    time: 0,
    running: null,
    event: "initial",
    executedTask: null,
    intervalStart: null,
    intervalEnd: null,
    ready: algorithm === "rr" ? [...rrQueue] : available(0),
    remaining: remainingSnapshot(),
    completed: [],
    events: ["initial"],
  });

  while (completion.size < normalized.length && time < finishHorizon) {
    let selected: string | null = null;
    const events: CpuStepEvent[] = [];

    if (algorithm === "rr") {
      if (current === null) {
        current = rrQueue.shift() ?? null;
        rrUsed = 0;
      }
      selected = current;
    } else {
      const candidates = available(time);
      if (algorithm === "srtf") {
        selected = [...candidates].sort((left, right) => {
          const leftTask = byId.get(left)!;
          const rightTask = byId.get(right)!;
          return (
            (remaining.get(left) ?? 0) - (remaining.get(right) ?? 0) ||
            leftTask.arrival - rightTask.arrival ||
            inputCompare(left, right)
          );
        })[0] ?? null;
      } else if (current !== null && (remaining.get(current) ?? 0) > 0) {
        selected = current;
      } else if (algorithm === "sjf") {
        selected = [...candidates].sort((left, right) => {
          const leftTask = byId.get(left)!;
          const rightTask = byId.get(right)!;
          return (
            leftTask.burst - rightTask.burst ||
            leftTask.arrival - rightTask.arrival ||
            inputCompare(left, right)
          );
        })[0] ?? null;
      } else {
        selected = [...candidates].sort((left, right) => {
          const leftTask = byId.get(left)!;
          const rightTask = byId.get(right)!;
          return (
            leftTask.arrival - rightTask.arrival || inputCompare(left, right)
          );
        })[0] ?? null;
      }
      current = selected;
    }

    if (selected === null) {
      const start = time;
      appendSlice(slices, null, start, start + 1);
      time += 1;
      if (algorithm === "rr") addRrArrivals(start, time);
      previousExecuted = null;
      steps.push({
        time,
        running: null,
        event: "idle",
        executedTask: null,
        intervalStart: start,
        intervalEnd: time,
        ready: algorithm === "rr" ? [...rrQueue] : available(time),
        remaining: remainingSnapshot(),
        completed: completedIds(),
        events: ["idle"],
      });
      continue;
    }

    if (
      algorithm === "srtf" &&
      previousExecuted !== null &&
      previousExecuted !== selected &&
      (remaining.get(previousExecuted) ?? 0) > 0
    ) {
      events.push("preempt");
    } else {
      events.push(selected === previousExecuted ? "continue" : "dispatch");
    }

    if (!firstStart.has(selected)) firstStart.set(selected, time);
    const start = time;
    appendSlice(slices, selected, start, start + 1);
    remaining.set(selected, (remaining.get(selected) ?? 0) - 1);
    time += 1;

    if (algorithm === "rr") {
      rrUsed += 1;
      addRrArrivals(start, time);
      if ((remaining.get(selected) ?? 0) === 0) {
        completion.set(selected, time);
        current = null;
        rrUsed = 0;
        events.push("complete");
      } else if (rrUsed >= safeQuantum) {
        rrQueue.push(selected);
        current = null;
        rrUsed = 0;
        events.push("quantum");
      }
    } else if ((remaining.get(selected) ?? 0) === 0) {
      completion.set(selected, time);
      current = null;
      events.push("complete");
    }

    steps.push({
      time,
      running: selected,
      event: events[0],
      executedTask: selected,
      intervalStart: start,
      intervalEnd: time,
      ready:
        algorithm === "rr"
          ? [...rrQueue]
          : available(time, current),
      remaining: remainingSnapshot(),
      completed: completedIds(),
      events,
    });
    previousExecuted = selected;
  }

  if (completion.size !== normalized.length) {
    throw new Error("CPU simulation ended before every task completed");
  }
  const metrics = Object.fromEntries(
    normalized.map((task) => {
      const end = completion.get(task.id)!;
      const turnaround = end - task.arrival;
      return [
        task.id,
        {
          completion: end,
          turnaround,
          waiting: turnaround - task.burst,
          response: firstStart.get(task.id)! - task.arrival,
        },
      ];
    }),
  );
  const metricValues = Object.values(metrics);
  return {
    steps,
    slices,
    metrics,
    averageWaiting:
      metricValues.reduce((sum, value) => sum + value.waiting, 0) /
      metricValues.length,
    averageResponse:
      metricValues.reduce((sum, value) => sum + value.response, 0) /
      metricValues.length,
    finishTime: maximumOf(
      metricValues.map((value) => value.completion),
    ),
  };
}

function gcd(left: number, right: number) {
  let a = Math.abs(left);
  let b = Math.abs(right);
  while (b !== 0) [a, b] = [b, a % b];
  return a || 1;
}

function lcm(left: number, right: number) {
  const value = Math.abs(left / gcd(left, right)) * right;
  if (!Number.isSafeInteger(value)) {
    throw new RangeError("LCM exceeds JavaScript's safe-integer range");
  }
  return value;
}

function copyQueues(queues: Map<string, FairRequest[]>, clients: FairClient[]) {
  return Object.fromEntries(
    clients.map((client) => [client.id, [...(queues.get(client.id) ?? [])]]),
  );
}

function copyNumbers(values: Map<string, number>, clients: FairClient[]) {
  return Object.fromEntries(
    clients.map((client) => [client.id, values.get(client.id) ?? 0]),
  );
}

/**
 * Per-tenant FIFO admission. SFQ uses an exact common integer scale for c/w.
 * A boundary join is processed before an admission while work remains; if the
 * previous admission drained every queue, SFQ resets before a same-time join.
 */
export function simulateFairDispatch(
  clients: FairClient[],
  algorithm: FairAlgorithm,
): FairSimulation {
  if (
    !(
      algorithm === "fifo" ||
      algorithm === "round-robin" ||
      algorithm === "shortest-request" ||
      algorithm === "sfq"
    )
  ) {
    throw new TypeError(`Unsupported fair algorithm: ${String(algorithm)}`);
  }
  validateIds(clients.map((client) => client.id), "Client");
  const normalized = clients.map((client) => ({
    ...client,
    requestCost: finiteFloor(client.requestCost, `${client.id}.requestCost`, 1),
    requestCount: finiteFloor(
      client.requestCount,
      `${client.id}.requestCount`,
      0,
    ),
    weight: finiteFloor(client.weight, `${client.id}.weight`, 1),
    joinAfter: finiteFloor(client.joinAfter, `${client.id}.joinAfter`, 0),
  }));
  const demandClients = normalized.filter((client) => client.requestCount > 0);
  const totalRequests = demandClients.reduce(
    (sum, client) => safeAdd(sum, client.requestCount),
    0,
  );
  if (totalRequests > MAX_SIMULATION_TICKS) {
    throw new RangeError(
      `Fair-dispatch simulation exceeds ${MAX_SIMULATION_TICKS} requests`,
    );
  }
  const admissionSnapshotReferences =
    safeMultiply(totalRequests, safeAdd(totalRequests, 1)) / 2;
  const joinStageReferences = safeMultiply(
    demandClients.length,
    totalRequests,
  );
  const snapshotReferences = safeAdd(
    admissionSnapshotReferences,
    joinStageReferences,
  );
  if (snapshotReferences > MAX_SNAPSHOT_REFERENCES) {
    throw new RangeError(
      `Fair-dispatch snapshots exceed ${MAX_SNAPSHOT_REFERENCES} queued references`,
    );
  }
  workConservingHorizon(
    demandClients.map((client) => ({
      arrival: client.joinAfter,
      work: client.requestCount,
    })),
  );
  const scale = demandClients.reduce(
    (current, client) => lcm(current, client.weight),
    1,
  );

  const queues = new Map(
    normalized.map((client) => [client.id, [] as FairRequest[]]),
  );
  const meters = new Map(normalized.map((client) => [client.id, 0]));
  const service = new Map(normalized.map((client) => [client.id, 0]));
  const counts = new Map(normalized.map((client) => [client.id, 0]));
  const joined = new Set<string>();
  const sequence: FairRequest[] = [];
  const steps: FairDispatchStep[] = [];
  let virtualTime = 0;
  let arrivalOrder = 0;
  let logicalTime = 0;
  let rrCursor = 0;
  let cohort: string[] = [];
  let cohortBaseline = new Map(service);

  const scaledRecord = (values: Map<string, number>) =>
    Object.fromEntries(
      normalized.map((client) => [
        client.id,
        (values.get(client.id) ?? 0) / scale,
      ]),
    );
  const activeIds = () =>
    demandClients
      .filter((client) => (queues.get(client.id)?.length ?? 0) > 0)
      .map((client) => client.id);
  const setCohort = (ids: string[]) => {
    const next = [...ids].sort(compareIds);
    if (!sameIds(next, cohort)) {
      cohort = next;
      cohortBaseline = new Map(service);
    }
  };
  const fairnessRecord = () =>
    Object.fromEntries(
      normalized.map((client) => [
        client.id,
        cohort.includes(client.id)
          ? ((service.get(client.id) ?? 0) -
              (cohortBaseline.get(client.id) ?? 0)) /
            scale
          : 0,
      ]),
    );
  const joinEligible = () => {
    const newlyJoined: string[] = [];
    for (const client of demandClients) {
      if (joined.has(client.id) || client.joinAfter > logicalTime) continue;
      joined.add(client.id);
      newlyJoined.push(client.id);
      if (algorithm === "sfq") {
        meters.set(
          client.id,
          Math.max(meters.get(client.id) ?? 0, virtualTime),
        );
      }
      const queue = queues.get(client.id)!;
      for (let index = 0; index < client.requestCount; index += 1) {
        queue.push({
          id: `r${arrivalOrder + 1}`,
          clientId: client.id,
          cost: client.requestCost,
          arrivalOrder,
        });
        arrivalOrder += 1;
      }
    }
    return newlyJoined;
  };
  const makeStep = (
    chosen: FairRequest | null,
    metersBefore: Record<string, number>,
    joinedClients: string[],
    idleReset: boolean,
  ): FairDispatchStep => ({
    index: sequence.length,
    logicalTime,
    chosen,
    queues: copyQueues(queues, normalized),
    metersBefore,
    meters: scaledRecord(meters),
    normalizedService: scaledRecord(service),
    dispatchedCount: copyNumbers(counts, normalized),
    fairnessCohort: [...cohort],
    fairnessService: fairnessRecord(),
    virtualTime: virtualTime / scale,
    joinedClients,
    idleReset,
  });

  let joinedNow = joinEligible();
  setCohort(activeIds());
  steps.push(makeStep(null, scaledRecord(meters), joinedNow, false));

  while (sequence.length < totalRequests) {
    let active = activeIds();
    if (active.length === 0) {
      const futureTimes = demandClients
        .filter((client) => !joined.has(client.id))
        .map((client) => client.joinAfter);
      if (futureTimes.length === 0) break;
      const reset = algorithm === "sfq" && sequence.length > 0;
      if (reset) virtualTime = maximumOf(meters.values(), virtualTime);
      logicalTime = Math.max(logicalTime, minimumOf(futureTimes));
      joinedNow = joinEligible();
      active = activeIds();
      setCohort(active);
      steps.push(makeStep(null, scaledRecord(meters), joinedNow, reset));
      joinedNow = [];
      if (active.length === 0) continue;
    } else {
      joinedNow = joinEligible();
      active = activeIds();
      setCohort(active);
      if (joinedNow.length > 0) {
        steps.push(makeStep(null, scaledRecord(meters), joinedNow, false));
        joinedNow = [];
      }
    }

    let chosenClient: string;
    if (algorithm === "fifo") {
      chosenClient = [...active].sort(
        (left, right) =>
          queues.get(left)![0].arrivalOrder -
          queues.get(right)![0].arrivalOrder,
      )[0];
    } else if (algorithm === "shortest-request") {
      chosenClient = [...active].sort(
        (left, right) =>
          queues.get(left)![0].cost - queues.get(right)![0].cost ||
          compareIds(left, right),
      )[0];
    } else if (algorithm === "round-robin") {
      chosenClient = active[0];
      for (let offset = 0; offset < demandClients.length; offset += 1) {
        const candidateIndex = (rrCursor + offset) % demandClients.length;
        const candidate = demandClients[candidateIndex].id;
        if (active.includes(candidate)) {
          chosenClient = candidate;
          rrCursor = (candidateIndex + 1) % demandClients.length;
          break;
        }
      }
    } else {
      chosenClient = [...active].sort(
        (left, right) =>
          (meters.get(left) ?? 0) - (meters.get(right) ?? 0) ||
          compareIds(left, right),
      )[0];
    }

    const metersBefore = scaledRecord(meters);
    const request = queues.get(chosenClient)!.shift()!;
    const client = demandClients.find((item) => item.id === chosenClient)!;
    const charge = safeMultiply(request.cost, scale / client.weight);
    if (algorithm === "sfq") {
      virtualTime = meters.get(chosenClient) ?? 0;
      meters.set(chosenClient, safeAdd(virtualTime, charge));
    }
    service.set(chosenClient, safeAdd(service.get(chosenClient) ?? 0, charge));
    counts.set(chosenClient, (counts.get(chosenClient) ?? 0) + 1);
    sequence.push(request);
    logicalTime = safeAdd(logicalTime, 1);

    const noFutureJoin = demandClients.every((client) => joined.has(client.id));
    const idleReset =
      algorithm === "sfq" && activeIds().length === 0 && noFutureJoin;
    if (idleReset) virtualTime = maximumOf(meters.values(), virtualTime);
    steps.push(makeStep(request, metersBefore, joinedNow, idleReset));
  }

  return { steps, sequence };
}

/** Exact safe-integer SFQ state machine for arbitrary leave/rejoin traces. */
export function createExactSfqState(clientIds: string[]): ExactSfqState {
  validateIds(clientIds, "Client");
  const ids = [...clientIds].sort(compareIds);
  return {
    virtualTimeTicks: 0,
    meterTicks: Object.fromEntries(ids.map((id) => [id, 0])),
    queues: Object.fromEntries(ids.map((id) => [id, []])),
  };
}

export function enqueueExactSfq(
  state: ExactSfqState,
  clientId: string,
  request: ExactSfqRequest,
) {
  const queue = state.queues[clientId];
  if (!queue) throw new Error(`Unknown SFQ client: ${clientId}`);
  if (!Number.isSafeInteger(request.chargeTicks) || request.chargeTicks <= 0) {
    throw new Error("SFQ chargeTicks must be a positive safe integer");
  }
  if (queue.length === 0) {
    state.meterTicks[clientId] = Math.max(
      state.meterTicks[clientId],
      state.virtualTimeTicks,
    );
  }
  queue.push(request);
}

export function dispatchExactSfq(
  state: ExactSfqState,
): ExactSfqDispatch | null {
  const clientId = Object.keys(state.queues)
    .filter((id) => state.queues[id].length > 0)
    .sort(
      (left, right) =>
        state.meterTicks[left] - state.meterTicks[right] ||
        compareIds(left, right),
    )[0];
  if (!clientId) return null;

  const request = state.queues[clientId][0];
  const startTicks = state.meterTicks[clientId];
  const finishTicks = safeAdd(startTicks, request.chargeTicks);
  state.queues[clientId].shift();
  state.virtualTimeTicks = startTicks;
  state.meterTicks[clientId] = finishTicks;
  const idleReset = Object.values(state.queues).every(
    (queue) => queue.length === 0,
  );
  if (idleReset) {
    state.virtualTimeTicks = maximumOf(
      Object.values(state.meterTicks),
      state.virtualTimeTicks,
    );
  }
  return { clientId, request, startTicks, finishTicks, idleReset };
}

export function jainsFairness(values: number[]): number | null {
  if (values.length === 0 || values.every((value) => value === 0)) return null;
  const sum = values.reduce((total, value) => total + value, 0);
  const squared = values.reduce((total, value) => total + value * value, 0);
  return (sum * sum) / (values.length * squared);
}
