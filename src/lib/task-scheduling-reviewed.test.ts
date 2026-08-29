import { describe, expect, it } from "vitest";
import {
  createExactSfqState,
  dispatchExactSfq,
  enqueueExactSfq,
  simulateCpu,
  simulateFairDispatch,
} from "@/lib/task-scheduling-model";

describe("CPU transition records", () => {
  it("preserves simultaneous preemption and completion", () => {
    const result = simulateCpu(
      [
        { id: "A", arrival: 0, burst: 5 },
        { id: "B", arrival: 1, burst: 1 },
      ],
      "srtf",
    );

    expect(result.steps[1]).toMatchObject({
      time: 1,
      executedTask: "A",
      intervalStart: 0,
      intervalEnd: 1,
      events: ["dispatch"],
    });
    expect(result.steps[2]).toMatchObject({
      time: 2,
      executedTask: "B",
      intervalStart: 1,
      intervalEnd: 2,
      events: ["preempt", "complete"],
      completed: ["B"],
    });
  });

  it("records RR dispatch and quantum expiry in the same tick", () => {
    const result = simulateCpu(
      [
        { id: "A", arrival: 0, burst: 2 },
        { id: "B", arrival: 0, burst: 1 },
      ],
      "rr",
      1,
    );

    expect(result.steps[1]).toMatchObject({
      executedTask: "A",
      ready: ["B", "A"],
      events: ["dispatch", "quantum"],
    });
    expect(result.steps[2]).toMatchObject({
      executedTask: "B",
      ready: ["A"],
      events: ["dispatch", "complete"],
    });
    expect(result.steps[3]).toMatchObject({
      executedTask: "A",
      events: ["dispatch", "complete"],
    });
  });

  it("represents idle intervals explicitly before a late arrival", () => {
    const result = simulateCpu([{ id: "A", arrival: 2, burst: 1 }], "fcfs");

    expect(result.steps.map((step) => step.events)).toEqual([
      ["initial"],
      ["idle"],
      ["idle"],
      ["dispatch", "complete"],
    ]);
    expect(result.steps[2]).toMatchObject({ intervalStart: 1, intervalEnd: 2 });
  });

  it("rejects non-finite values and duplicate task IDs", () => {
    expect(() =>
      simulateCpu([{ id: "A", arrival: Number.POSITIVE_INFINITY, burst: 1 }], "fcfs"),
    ).toThrow(/finite/);
    expect(() =>
      simulateCpu(
        [
          { id: "A", arrival: 0, burst: 1 },
          { id: "A", arrival: 1, burst: 1 },
        ],
        "fcfs",
      ),
    ).toThrow(/unique/);
    expect(() =>
      simulateCpu([{ id: "A", arrival: 0, burst: 1 }], "invalid" as "fcfs"),
    ).toThrow(/Unsupported/);
  });

  it("breaks equal SJF and SRTF keys by arrival then input order", () => {
    const tasks = [
      { id: "B", arrival: 0, burst: 2 },
      { id: "A", arrival: 0, burst: 2 },
    ];
    expect(simulateCpu(tasks, "sjf").slices[0].taskId).toBe("B");
    expect(simulateCpu(tasks, "srtf").slices[0].taskId).toBe("B");
  });

  it("enqueues a boundary arrival before requeueing an expired RR task", () => {
    const result = simulateCpu(
      [
        { id: "A", arrival: 0, burst: 2 },
        { id: "B", arrival: 1, burst: 1 },
      ],
      "rr",
      1,
    );
    expect(result.steps[1].ready).toEqual(["B", "A"]);
    expect(result.slices.map((slice) => slice.taskId)).toEqual(["A", "B", "A"]);
  });
});

describe("fair-dispatch logical time", () => {
  it("inserts an explicit reset and join stage when queues drain before C arrives", () => {
    const result = simulateFairDispatch(
      [
        { id: "A", requestCost: 1, requestCount: 1, weight: 1, joinAfter: 0 },
        { id: "B", requestCost: 1, requestCount: 1, weight: 1, joinAfter: 0 },
        { id: "C", requestCost: 1, requestCount: 2, weight: 1, joinAfter: 6 },
      ],
      "sfq",
    );

    expect(result.sequence.map((request) => request.clientId)).toEqual([
      "A",
      "B",
      "C",
      "C",
    ]);
    const joinStage = result.steps.find(
      (step) => step.chosen === null && step.joinedClients.includes("C"),
    );
    expect(joinStage).toMatchObject({
      index: 2,
      logicalTime: 6,
      idleReset: true,
    });
    expect(joinStage!.queues.C).toHaveLength(2);
    expect(result.steps.filter((step) => step.joinedClients.includes("C"))).toHaveLength(1);
    expect(result.steps[result.steps.indexOf(joinStage!) + 1].joinedClients).toEqual([]);
  });

  it("records a join at its pre-dispatch time while other queues remain active", () => {
    const result = simulateFairDispatch(
      [
        { id: "A", requestCost: 2, requestCount: 5, weight: 1, joinAfter: 0 },
        { id: "B", requestCost: 1, requestCount: 5, weight: 1, joinAfter: 0 },
        { id: "C", requestCost: 1, requestCount: 1, weight: 1, joinAfter: 3 },
      ],
      "sfq",
    );
    const joinSteps = result.steps.filter((step) => step.joinedClients.includes("C"));

    expect(joinSteps).toHaveLength(1);
    expect(joinSteps[0]).toMatchObject({
      index: 3,
      logicalTime: 3,
      chosen: null,
    });
    expect(joinSteps[0].fairnessService).toEqual({ A: 0, B: 0, C: 0 });
    const nextDispatch = result.steps[result.steps.indexOf(joinSteps[0]) + 1];
    expect(nextDispatch.chosen).not.toBeNull();
    const owner = nextDispatch.chosen!.clientId;
    expect(nextDispatch.fairnessService[owner]).toBe(
      nextDispatch.chosen!.cost /
        (["A", "B", "C"].includes(owner)
          ? [
              { id: "A", weight: 1 },
              { id: "B", weight: 1 },
              { id: "C", weight: 1 },
            ].find((client) => client.id === owner)!.weight
          : 1),
    );
  });

  it("stores the cohort eligible immediately before a draining dispatch", () => {
    const result = simulateFairDispatch(
      [
        { id: "A", requestCost: 1, requestCount: 1, weight: 1, joinAfter: 0 },
        { id: "B", requestCost: 1, requestCount: 2, weight: 1, joinAfter: 0 },
      ],
      "sfq",
    );

    expect(result.steps[1].fairnessCohort).toEqual(["A", "B"]);
    expect(result.steps[1].queues.A).toEqual([]);
    expect(result.steps[2].fairnessCohort).toEqual(["B"]);
    expect(result.steps[2].fairnessService.B).toBe(1);
  });

  it("uses configured client order for simultaneous FIFO batches", () => {
    const result = simulateFairDispatch(
      [
        { id: "B", requestCost: 1, requestCount: 2, weight: 1, joinAfter: 0 },
        { id: "A", requestCost: 1, requestCount: 2, weight: 1, joinAfter: 0 },
      ],
      "fifo",
    );
    expect(result.sequence.map((request) => request.clientId)).toEqual([
      "B",
      "B",
      "A",
      "A",
    ]);
  });

  it("rejects invalid client values and duplicate IDs", () => {
    expect(() =>
      simulateFairDispatch(
        [{ id: "A", requestCost: 1, requestCount: 1, weight: Number.NaN, joinAfter: 0 }],
        "sfq",
      ),
    ).toThrow(/finite/);
    expect(() =>
      simulateFairDispatch(
        [
          { id: "A", requestCost: 1, requestCount: 1, weight: 1, joinAfter: 0 },
          { id: "A", requestCost: 1, requestCount: 1, weight: 1, joinAfter: 0 },
        ],
        "sfq",
      ),
    ).toThrow(/unique/);
    expect(() =>
      simulateFairDispatch([], "invalid" as "sfq"),
    ).toThrow(/Unsupported/);
    expect(() =>
      simulateFairDispatch(
        [
          {
            id: "A",
            requestCost: 1,
            requestCount: 1_000_001,
            weight: 1,
            joinAfter: 0,
          },
        ],
        "sfq",
      ),
    ).toThrow(/exceeds/);
  });

  it("performs the final reset despite a future zero-demand client", () => {
    const result = simulateFairDispatch(
      [
        { id: "A", requestCost: 5, requestCount: 1, weight: 1, joinAfter: 0 },
        { id: "Z", requestCost: 1, requestCount: 0, weight: 1, joinAfter: 100 },
      ],
      "sfq",
    );
    const final = result.steps.at(-1)!;
    expect(final.idleReset).toBe(true);
    expect(final.virtualTime).toBe(5);
  });

  it("resets before a client joins exactly when the prior queues drain", () => {
    const result = simulateFairDispatch(
      [
        { id: "A", requestCost: 5, requestCount: 1, weight: 1, joinAfter: 0 },
        { id: "B", requestCost: 1, requestCount: 1, weight: 1, joinAfter: 1 },
      ],
      "sfq",
    );
    const join = result.steps.find((step) => step.joinedClients.includes("B"))!;
    expect(join).toMatchObject({ logicalTime: 1, chosen: null, idleReset: true });
    expect(join.virtualTime).toBe(5);
    expect(join.meters.B).toBe(5);
  });
});

describe("weighted SFQ bound", () => {
  it("requires the pre-interval busy-period maximum to cover retained debt", () => {
    const state = createExactSfqState(["A", "B"]);
    enqueueExactSfq(state, "A", { id: "A-heavy", chargeTicks: 100 });
    enqueueExactSfq(state, "A", { id: "A-next", chargeTicks: 1 });
    for (let index = 0; index < 120; index += 1) {
      enqueueExactSfq(state, "B", { id: `B${index}`, chargeTicks: 1 });
    }

    expect(dispatchExactSfq(state)!.request.id).toBe("A-heavy");
    let intervalA = 0;
    let intervalB = 0;
    for (let index = 0; index < 10; index += 1) {
      const dispatched = dispatchExactSfq(state)!;
      if (dispatched.clientId === "A") intervalA += dispatched.request.chargeTicks;
      else intervalB += dispatched.request.chargeTicks;
    }

    const difference = Math.abs(intervalA - intervalB);
    expect(difference).toBeGreaterThan(2 * 1);
    expect(difference).toBeLessThanOrEqual(2 * 100);
  });

  it("bounds every subinterval by twice the busy-period maximum normalized charge", () => {
    const state = createExactSfqState(["A", "B"]);
    // Ticks already represent c / w in a common fixed-point unit.
    for (let index = 0; index < 40; index += 1) {
      enqueueExactSfq(state, "A", {
        id: `A${index}`,
        chargeTicks: index % 2 === 0 ? 2 : 4,
      });
      enqueueExactSfq(state, "B", {
        id: `B${index}`,
        chargeTicks: index % 3 === 0 ? 6 : 2,
      });
    }

    const service = { A: 0, B: 0 };
    const boundaries = [{ ...service }];
    for (let index = 0; index < 50; index += 1) {
      const dispatched = dispatchExactSfq(state)!;
      service[dispatched.clientId as "A" | "B"] +=
        dispatched.request.chargeTicks;
      boundaries.push({ ...service });
    }

    const busyPeriodMaximum = 6;
    for (let start = 0; start < boundaries.length; start += 1) {
      for (let end = start; end < boundaries.length; end += 1) {
        const deltaA = boundaries[end].A - boundaries[start].A;
        const deltaB = boundaries[end].B - boundaries[start].B;
        expect(Math.abs(deltaA - deltaB)).toBeLessThanOrEqual(
          2 * busyPeriodMaximum,
        );
      }
    }
  });

  it("rejects unsafe integer charges and counter overflow", () => {
    const state = createExactSfqState(["A"]);
    expect(() =>
      enqueueExactSfq(state, "A", {
        id: "unsafe",
        chargeTicks: Number.MAX_SAFE_INTEGER + 1,
      }),
    ).toThrow(/safe integer/);

    enqueueExactSfq(state, "A", {
      id: "max",
      chargeTicks: Number.MAX_SAFE_INTEGER,
    });
    dispatchExactSfq(state);
    enqueueExactSfq(state, "A", { id: "overflow", chargeTicks: 1 });
    const before = structuredClone(state);
    expect(() => dispatchExactSfq(state)).toThrow(/safe-integer range/);
    expect(state).toEqual(before);
  });

  it("rejects public-simulator scale, charge, service, and logical-time overflow", () => {
    expect(() =>
      simulateFairDispatch(
        [
          { id: "A", requestCost: 1, requestCount: 1, weight: 3_037_000_499, joinAfter: 0 },
          { id: "B", requestCost: 1, requestCount: 1, weight: 3_037_000_503, joinAfter: 0 },
        ],
        "sfq",
      ),
    ).toThrow(/LCM|safe-integer/);

    expect(() =>
      simulateFairDispatch(
        [
          {
            id: "A",
            requestCost: Number.MAX_SAFE_INTEGER,
            requestCount: 1,
            weight: 1,
            joinAfter: 1,
          },
          {
            id: "B",
            requestCost: 1,
            requestCount: 1,
            weight: 2,
            joinAfter: 1,
          },
        ],
        "sfq",
      ),
    ).toThrow(/safe-integer/);

    expect(() =>
      simulateFairDispatch(
        [
          {
            id: "A",
            requestCost: Number.MAX_SAFE_INTEGER,
            requestCount: 2,
            weight: 1,
            joinAfter: 0,
          },
        ],
        "fifo",
      ),
    ).toThrow(/safe-integer/);

    expect(() =>
      simulateFairDispatch(
        [
          {
            id: "A",
            requestCost: 1,
            requestCount: 1,
            weight: 1,
            joinAfter: Number.MAX_SAFE_INTEGER,
          },
        ],
        "sfq",
      ),
    ).toThrow(/safe-integer/);
  });
});
