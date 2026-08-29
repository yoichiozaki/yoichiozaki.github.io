import { describe, expect, it } from "vitest";
import {
  createExactSfqState,
  dispatchExactSfq,
  enqueueExactSfq,
  jainsFairness,
  simulateCpu,
  simulateFairDispatch,
  type CpuSlice,
  type FairClient,
} from "@/lib/task-scheduling-model";

function executionOrder(slices: CpuSlice[]) {
  return slices
    .filter((slice) => slice.taskId !== null)
    .map((slice) => `${slice.taskId}:${slice.start}-${slice.end}`);
}

describe("simulateCpu", () => {
  it("keeps FCFS non-preemptive and preserves arrival order", () => {
    const result = simulateCpu(
      [
        { id: "A", arrival: 0, burst: 3 },
        { id: "B", arrival: 1, burst: 1 },
      ],
      "fcfs",
    );

    expect(executionOrder(result.slices)).toEqual(["A:0-3", "B:3-4"]);
    expect(result.metrics.B.waiting).toBe(2);
    expect(result.metrics.B.response).toBe(2);
  });

  it("chooses the shortest available job with non-preemptive SJF", () => {
    const result = simulateCpu(
      [
        { id: "A", arrival: 0, burst: 3 },
        { id: "B", arrival: 0, burst: 1 },
        { id: "C", arrival: 0, burst: 2 },
      ],
      "sjf",
    );

    expect(executionOrder(result.slices)).toEqual([
      "B:0-1",
      "C:1-3",
      "A:3-6",
    ]);
  });

  it("preempts for a newly arrived shorter remaining task with SRTF", () => {
    const result = simulateCpu(
      [
        { id: "A", arrival: 0, burst: 5 },
        { id: "B", arrival: 1, burst: 1 },
      ],
      "srtf",
    );

    expect(executionOrder(result.slices)).toEqual([
      "A:0-1",
      "B:1-2",
      "A:2-6",
    ]);
    expect(result.steps.some((step) => step.event === "preempt")).toBe(true);
  });

  it("rotates runnable tasks after the round-robin quantum", () => {
    const result = simulateCpu(
      [
        { id: "A", arrival: 0, burst: 3 },
        { id: "B", arrival: 0, burst: 2 },
      ],
      "rr",
      1,
    );

    expect(executionOrder(result.slices)).toEqual([
      "A:0-1",
      "B:1-2",
      "A:2-3",
      "B:3-4",
      "A:4-5",
    ]);
  });
});

describe("simulateFairDispatch", () => {
  const clients: FairClient[] = [
    { id: "A", requestCost: 3, requestCount: 2, weight: 1, joinAfter: 0 },
    { id: "B", requestCost: 1, requestCount: 6, weight: 1, joinAfter: 0 },
  ];

  it("balances estimated cost rather than request count with SFQ", () => {
    const result = simulateFairDispatch(clients, "sfq");

    expect(result.sequence.map((request) => request.clientId)).toEqual([
      "A",
      "B",
      "B",
      "B",
      "A",
      "B",
      "B",
      "B",
    ]);
    const afterFourDispatches = result.steps[4];
    expect(afterFourDispatches.normalizedService.A).toBe(3);
    expect(afterFourDispatches.normalizedService.B).toBe(3);
  });

  it("round robin balances request count, not request cost", () => {
    const result = simulateFairDispatch(clients, "round-robin");
    const afterFourDispatches = result.steps[4];

    expect(result.sequence.slice(0, 4).map((request) => request.clientId)).toEqual([
      "A",
      "B",
      "A",
      "B",
    ]);
    expect(afterFourDispatches.normalizedService.A).toBe(6);
    expect(afterFourDispatches.normalizedService.B).toBe(2);
  });

  it("normalizes SFQ charges by client weight", () => {
    const result = simulateFairDispatch(
      [
        { id: "A", requestCost: 2, requestCount: 2, weight: 2, joinAfter: 0 },
        { id: "B", requestCost: 1, requestCount: 2, weight: 1, joinAfter: 0 },
      ],
      "sfq",
    );

    expect(result.sequence.map((request) => request.clientId)).toEqual([
      "A",
      "B",
      "A",
      "B",
    ]);
  });

  it("lifts a late client's meter to virtual time instead of banking idle credit", () => {
    const result = simulateFairDispatch(
      [
        { id: "A", requestCost: 3, requestCount: 3, weight: 1, joinAfter: 0 },
        { id: "B", requestCost: 1, requestCount: 5, weight: 1, joinAfter: 0 },
        { id: "C", requestCost: 1, requestCount: 1, weight: 1, joinAfter: 3 },
      ],
      "sfq",
    );

    const joinIndex = result.steps.findIndex((step) =>
      step.joinedClients.includes("C"),
    );
    const joinStep = result.steps[joinIndex];
    expect(joinIndex).toBeGreaterThan(0);
    expect(joinStep.metersBefore.C).toBeGreaterThanOrEqual(
      result.steps[joinIndex - 1].virtualTime,
    );
    expect(joinStep.metersBefore.C).toBeGreaterThan(0);
  });

  it("advances virtual time to the largest finish tag after global idle", () => {
    const result = simulateFairDispatch(clients, "sfq");
    const final = result.steps.at(-1)!;

    expect(final.idleReset).toBe(true);
    expect(final.virtualTime).toBe(Math.max(...Object.values(final.meters)));
  });

  it("uses lexical tenant IDs to break equal-meter ties", () => {
    const result = simulateFairDispatch(
      [
        { id: "B", requestCost: 1, requestCount: 1, weight: 1, joinAfter: 0 },
        { id: "A", requestCost: 1, requestCount: 1, weight: 1, joinAfter: 0 },
      ],
      "sfq",
    );

    expect(result.sequence.map((request) => request.clientId)).toEqual(["A", "B"]);
  });

  it("keeps fractional weighted charges exact at a later tie", () => {
    const result = simulateFairDispatch(
      [
        { id: "A", requestCost: 1, requestCount: 7, weight: 3, joinAfter: 0 },
        { id: "B", requestCost: 2, requestCount: 2, weight: 1, joinAfter: 0 },
      ],
      "sfq",
    );

    expect(result.sequence.slice(0, 8).map((request) => request.clientId)).toEqual([
      "A",
      "B",
      "A",
      "A",
      "A",
      "A",
      "A",
      "A",
    ]);
    expect(result.steps[8].metersBefore.A).toBe(2);
    expect(result.steps[8].metersBefore.B).toBe(2);
  });

  it("keeps active SFQ meters inside one busy-period maximum charge", () => {
    const result = simulateFairDispatch(
      [
        { id: "A", requestCost: 8, requestCount: 3, weight: 1, joinAfter: 0 },
        { id: "B", requestCost: 2, requestCount: 7, weight: 1, joinAfter: 0 },
        { id: "C", requestCost: 4, requestCount: 4, weight: 2, joinAfter: 3 },
      ],
      "sfq",
    );
    const maximumNormalizedCharge = 8;

    for (const step of result.steps) {
      const active = Object.entries(step.queues)
        .filter(([, queue]) => queue.length > 0)
        .map(([clientId]) => clientId);
      for (const clientId of active) {
        expect(step.meters[clientId]).toBeGreaterThanOrEqual(step.virtualTime);
        expect(step.meters[clientId]).toBeLessThanOrEqual(
          step.virtualTime + maximumNormalizedCharge,
        );
      }
    }
  });
});

describe("exact SFQ state machine", () => {
  it("bounds interval service difference while both clients stay backlogged", () => {
    const state = createExactSfqState(["A", "B"]);
    for (let index = 0; index < 30; index += 1) {
      enqueueExactSfq(state, "A", { id: `A${index}`, chargeTicks: 3 });
      enqueueExactSfq(state, "B", { id: `B${index}`, chargeTicks: 1 });
    }
    const service = { A: 0, B: 0 };
    const boundaries = [{ ...service }];
    for (let index = 0; index < 30; index += 1) {
      const dispatched = dispatchExactSfq(state)!;
      service[dispatched.clientId as "A" | "B"] += dispatched.request.chargeTicks;
      boundaries.push({ ...service });
    }

    for (let start = 0; start < boundaries.length; start += 1) {
      for (let end = start; end < boundaries.length; end += 1) {
        const a = boundaries[end].A - boundaries[start].A;
        const b = boundaries[end].B - boundaries[start].B;
        expect(Math.abs(a - b)).toBeLessThanOrEqual(2 * 3);
      }
    }
  });

  it("retains old debt across leave and rejoin within the same busy period", () => {
    const state = createExactSfqState(["A", "B"]);
    enqueueExactSfq(state, "A", { id: "A-heavy", chargeTicks: 100 });
    for (let index = 0; index < 120; index += 1) {
      enqueueExactSfq(state, "B", { id: `B${index}`, chargeTicks: 1 });
    }

    expect(dispatchExactSfq(state)!.clientId).toBe("A");
    expect(dispatchExactSfq(state)!.clientId).toBe("B");
    enqueueExactSfq(state, "A", { id: "A-return", chargeTicks: 1 });

    expect(state.meterTicks.A).toBe(100);
    expect(state.virtualTimeTicks).toBe(0);
    expect(state.meterTicks.A).toBeLessThanOrEqual(state.virtualTimeTicks + 100);
    expect(dispatchExactSfq(state)!.clientId).toBe("B");
  });

  it("prevents repeated one-request rejoining from banking credit", () => {
    const state = createExactSfqState(["A", "B"]);
    for (let index = 0; index < 20; index += 1) {
      enqueueExactSfq(state, "B", { id: `B${index}`, chargeTicks: 1 });
    }

    let serviceA = 0;
    let serviceB = 0;
    for (let index = 0; index < 12; index += 1) {
      if (state.queues.A.length === 0) {
        enqueueExactSfq(state, "A", { id: `A${index}`, chargeTicks: 1 });
      }
      const dispatched = dispatchExactSfq(state)!;
      if (dispatched.clientId === "A") serviceA += 1;
      else serviceB += 1;
      expect(Math.abs(serviceA - serviceB)).toBeLessThanOrEqual(2);
    }
  });

  it("rebases a new busy period after global idle", () => {
    const state = createExactSfqState(["A", "B"]);
    enqueueExactSfq(state, "A", { id: "A1", chargeTicks: 100 });
    const first = dispatchExactSfq(state)!;
    expect(first.idleReset).toBe(true);
    expect(state.virtualTimeTicks).toBe(100);

    enqueueExactSfq(state, "B", { id: "B1", chargeTicks: 1 });
    const next = dispatchExactSfq(state)!;
    expect(next.startTicks).toBe(100);
  });
});

describe("jainsFairness", () => {
  it("is one for equal allocations and one half for a two-client monopoly", () => {
    expect(jainsFairness([4, 4])).toBe(1);
    expect(jainsFairness([8, 0])).toBe(0.5);
  });

  it("is undefined when no service has been observed", () => {
    expect(jainsFairness([0, 0])).toBeNull();
    expect(jainsFairness([])).toBeNull();
  });
});
