import { describe, expect, it } from "vitest";
import {
  simulateCpu,
  simulateFairDispatch,
  sameIds,
  workConservingHorizon,
} from "@/lib/task-scheduling-model";

describe("consolidated scheduling model boundaries", () => {
  it("compares cohort arrays element-by-element, not by joined text", () => {
    const left = ["A", "B|C"];
    const right = ["A|B", "C"];
    expect(left.join("|")).toBe(right.join("|"));
    expect(sameIds(left, right)).toBe(false);
  });

  it("rejects quadratic snapshot volume before queue allocation", () => {
    expect(() =>
      simulateFairDispatch(
        [
          {
            id: "A",
            requestCost: 1,
            requestCount: 2_000,
            weight: 1,
            joinAfter: 0,
          },
        ],
        "sfq",
      ),
    ).toThrow(/snapshots exceed/);
  });

  it("budgets join-only snapshots conservatively", () => {
    const clients = [
      { id: "A", requestCost: 1, requestCount: 1_000, weight: 1, joinAfter: 0 },
      ...Array.from({ length: 999 }, (_, index) => ({
        id: `J${index}`,
        requestCost: 1,
        requestCount: 1,
        weight: 1,
        joinAfter: index + 1,
      })),
    ];
    expect(() => simulateFairDispatch(clients, "fifo")).toThrow(/snapshots exceed/);
  });

  it("rejects excessive CPU task-tick snapshot volume", () => {
    const tasks = Array.from({ length: 3_000 }, (_, index) => ({
      id: `T${index}`,
      arrival: 0,
      burst: 1,
    }));
    expect(() => simulateCpu(tasks, "fcfs")).toThrow(/CPU snapshots exceed/);
  });

  it("computes exact work-conserving horizons without double-counting", () => {
    expect(
      workConservingHorizon([
        { arrival: 0, work: 500_000 },
        { arrival: 500_000, work: 1 },
      ]),
    ).toBe(500_001);
  });

  it("validates RR quantum on an empty workload", () => {
    expect(() => simulateCpu([], "rr", 0)).toThrow(/quantum/);
  });

  it("does not label initial idle as a completed busy period", () => {
    const result = simulateFairDispatch(
      [
        { id: "A", requestCost: 1, requestCount: 1, weight: 1, joinAfter: 10 },
      ],
      "sfq",
    );
    const join = result.steps.find((step) => step.joinedClients.includes("A"))!;
    expect(join.idleReset).toBe(false);
  });

  it("accepts the maximal safe horizon and rejects one beyond it", () => {
    expect(() =>
      simulateFairDispatch(
        [
          {
            id: "A",
            requestCost: 1,
            requestCount: 1,
            weight: 1,
            joinAfter: Number.MAX_SAFE_INTEGER - 1,
          },
        ],
        "sfq",
      ),
    ).not.toThrow();
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

  it("keeps extreme zero-demand clients inert", () => {
    expect(() =>
      simulateFairDispatch(
        [
          { id: "A", requestCost: 2, requestCount: 1, weight: 2, joinAfter: 0 },
          {
            id: "Z",
            requestCost: 1,
            requestCount: 0,
            weight: Number.MAX_SAFE_INTEGER,
            joinAfter: Number.MAX_SAFE_INTEGER,
          },
        ],
        "sfq",
      ),
    ).not.toThrow();
  });

  it("uses globally unique request IDs for the historical concatenation collision", () => {
    const result = simulateFairDispatch(
      [
        { id: "A", requestCost: 1, requestCount: 11, weight: 1, joinAfter: 0 },
        {
          id: "A1",
          requestCost: 1,
          requestCount: 1,
          weight: 1,
          joinAfter: 0,
        },
      ],
      "sfq",
    );
    expect(new Set(result.sequence.map((request) => request.id)).size).toBe(12);
  });

  it("resets cohort baselines for delimiter-like but different ID arrays", () => {
    const result = simulateFairDispatch(
      [
        { id: "A", requestCost: 1, requestCount: 2, weight: 1, joinAfter: 0 },
        { id: "B|C", requestCost: 1, requestCount: 1, weight: 1, joinAfter: 0 },
        { id: "A|B", requestCost: 1, requestCount: 2, weight: 1, joinAfter: 1 },
        { id: "C", requestCost: 1, requestCount: 2, weight: 1, joinAfter: 1 },
      ],
      "sfq",
    );
    const cohorts = result.steps.map((step) => step.fairnessCohort.join(","));
    expect(cohorts).toContain("A,B|C");
    expect(cohorts.some((value) => value.includes("A|B") && value.includes("C"))).toBe(true);
  });

  it("handles client cardinality above common function-argument limits", () => {
    const clients = Array.from({ length: 70_000 }, (_, index) => ({
      id: `Z${index}`,
      requestCost: 1,
      requestCount: index === 69_999 ? 1 : 0,
      weight: 1,
      joinAfter: index === 69_999 ? 10 : Number.MAX_SAFE_INTEGER,
    }));
    const result = simulateFairDispatch(clients, "sfq");
    expect(result.sequence).toHaveLength(1);
  });
});
