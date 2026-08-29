import { describe, expect, it } from "vitest";
import {
  simulateCpu,
  simulateFairDispatch,
  workConservingHorizon,
} from "@/lib/task-scheduling-model";

describe("fair simulator numeric and idle edges", () => {
  it("computes an exact work-conserving horizon without double-counting work", () => {
    expect(
      workConservingHorizon([
        { arrival: 0, work: 500_000 },
        { arrival: 500_000, work: 1 },
      ]),
    ).toBe(500_001);
  });

  it("validates an RR quantum even for an empty workload", () => {
    expect(() => simulateCpu([], "rr", 0)).toThrow(/quantum/);
  });
  it("does not materialize an oversized initial batch before rejecting it", () => {
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

  it("skips an intermediate zero-demand arrival without a duplicate reset", () => {
    const result = simulateFairDispatch(
      [
        { id: "A", requestCost: 5, requestCount: 1, weight: 1, joinAfter: 0 },
        { id: "Z", requestCost: 1, requestCount: 0, weight: 1, joinAfter: 5 },
        { id: "B", requestCost: 1, requestCount: 1, weight: 1, joinAfter: 10 },
      ],
      "sfq",
    );
    const idleStages = result.steps.filter(
      (step) => step.chosen === null && step.idleReset,
    );

    expect(idleStages).toHaveLength(1);
    expect(idleStages[0].logicalTime).toBe(10);
    expect(idleStages[0].joinedClients).toEqual(["B"]);
  });

  it("rejects runtime algorithm discriminants", () => {
    expect(() => simulateFairDispatch([], "invalid" as "sfq")).toThrow(
      /Unsupported/,
    );
  });

  it("guards LCM scaling, service accumulation, and logical time", () => {
    expect(() =>
      simulateFairDispatch(
        [
          {
            id: "A",
            requestCost: 1,
            requestCount: 1,
            weight: 3_037_000_499,
            joinAfter: 0,
          },
          {
            id: "B",
            requestCost: 1,
            requestCount: 1,
            weight: 3_037_000_503,
            joinAfter: 0,
          },
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
  });

  it("keeps zero-demand extremes inert", () => {
    expect(() =>
      simulateFairDispatch(
        [
          { id: "A", requestCost: 1, requestCount: 1, weight: 1, joinAfter: 0 },
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

  it("uses injective opaque request IDs and arbitrary client IDs safely", () => {
    const result = simulateFairDispatch(
      [
        { id: "A", requestCost: 1, requestCount: 11, weight: 1, joinAfter: 0 },
        { id: "A1\u0000x", requestCost: 1, requestCount: 1, weight: 1, joinAfter: 0 },
      ],
      "sfq",
    );
    expect(new Set(result.sequence.map((request) => request.id)).size).toBe(12);
  });

  it("calculates extrema without spread argument limits", () => {
    const clients = Array.from({ length: 70_000 }, (_, index) => ({
      id: `Z${index}`,
      requestCost: 1,
      requestCount: 0,
      weight: Number.MAX_SAFE_INTEGER,
      joinAfter: Number.MAX_SAFE_INTEGER,
    }));
    expect(() => simulateFairDispatch(clients, "sfq")).not.toThrow();
  });
});
