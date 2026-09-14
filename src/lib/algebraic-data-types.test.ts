import { describe, expect, it } from "vitest";
import {
  applyOrderEvent,
  classifyLegacyRequest,
  decodeDraft,
  draftPresets,
  parseDraftJson,
  recordPayment,
  recordRefund,
  requestCombinations,
  type DraftOrder,
  type Order,
  type OrderEvent,
} from "./algebraic-data-types";

const draft: DraftOrder = {
  kind: "draft",
  orderId: "order-42",
  amountYen: 1200,
};
const paid = recordPayment(draft, "pay-demo");
const refunded = recordRefund(paid, "refund-demo");

describe("ADT state-space experiment", () => {
  it("enumerates eight distinct presence combinations, four of them valid", () => {
    expect(requestCombinations).toHaveLength(8);
    expect(new Set(requestCombinations.map((value) => JSON.stringify(value))).size)
      .toBe(8);
    const results = requestCombinations.map(classifyLegacyRequest);
    expect(results.map((result) => result.ok ? result.value.kind : result.error))
      .toEqual([
        "idle",
        "failure",
        "success",
        "two-results",
        "loading",
        "loading-with-result",
        "loading-with-result",
        "loading-with-result",
      ]);
    expect(results.filter((result) => result.ok)).toHaveLength(4);
  });

  it("tests presence, not truthiness, for data and errors", () => {
    expect(classifyLegacyRequest({ isLoading: false, data: "", error: null }))
      .toEqual({ ok: true, value: { kind: "success", data: "" } });
    expect(classifyLegacyRequest({ isLoading: false, data: null, error: "" }))
      .toEqual({ ok: true, value: { kind: "failure", error: "" } });
    expect(classifyLegacyRequest({ isLoading: false, data: "", error: "" }))
      .toEqual({ ok: false, error: "two-results" });
  });
});

describe("ADT input boundary", () => {
  it.each([null, undefined, false, 42, "draft", []])(
    "rejects a non-object input: %j",
    (input) => {
      expect(decodeDraft(input)).toEqual({ ok: false, error: "not-object" });
    },
  );

  it.each([{}, { kind: "paid" }, { kind: "reserved" }, { kind: null }])(
    "rejects unsupported or missing discriminants: %j",
    (input) => {
      expect(decodeDraft(input)).toEqual({ ok: false, error: "not-draft" });
    },
  );

  it.each(["", " \t\n", 42, null, undefined])(
    "rejects invalid order IDs: %j",
    (orderId) => {
      expect(decodeDraft({ ...draft, orderId }))
        .toEqual({ ok: false, error: "invalid-order-id" });
    },
  );

  it.each([
    0, -0, -1, 1.5, Number.NaN, Infinity, -Infinity,
    Number.MAX_SAFE_INTEGER + 1, "1200", null, undefined,
  ])("rejects an invalid amount: %s", (amountYen) => {
    expect(decodeDraft({ ...draft, amountYen }))
      .toEqual({ ok: false, error: "invalid-amount" });
  });

  it.each([1, 1200, Number.MAX_SAFE_INTEGER])(
    "accepts positive safe integer amounts: %s",
    (amountYen) => {
      expect(decodeDraft({ ...draft, amountYen }))
        .toEqual({ ok: true, value: { ...draft, amountYen } });
    },
  );

  it("requires both fields even when they are absent rather than undefined", () => {
    expect(decodeDraft({ kind: "draft", amountYen: 1200 }))
      .toEqual({ ok: false, error: "invalid-order-id" });
    expect(decodeDraft({ kind: "draft", orderId: "order-42" }))
      .toEqual({ ok: false, error: "invalid-amount" });
  });

  it("reconstructs a detached value and discards unknown fields", () => {
    const input = { ...draft, paymentId: "not-a-paid-order" };
    const result = decodeDraft(input);
    expect(result).toEqual({ ok: true, value: draft });
    if (!result.ok) throw new Error("Expected a valid draft");
    expect(result.value).not.toBe(input);
    expect(result.value).not.toHaveProperty("paymentId");
    input.amountYen = 0;
    expect(result.value.amountYen).toBe(1200);
  });

  it("reports the correct error for every interactive input preset", () => {
    expect(draftPresets.map((preset) => {
      const result = parseDraftJson(preset.source);
      return result.ok ? "valid" : result.error;
    })).toEqual([
      "valid",
      "invalid-amount",
      "invalid-amount",
      "invalid-order-id",
      "not-draft",
      "invalid-json",
    ]);
  });

  it("distinguishes malformed JSON from valid JSON with invalid content", () => {
    expect(parseDraftJson("{")).toEqual({ ok: false, error: "invalid-json" });
    expect(parseDraftJson("null")).toEqual({ ok: false, error: "not-object" });
    expect(parseDraftJson("[]")).toEqual({ ok: false, error: "not-object" });
    expect(parseDraftJson('{"kind":"draft","orderId":"o","amountYen":1e309}'))
      .toEqual({ ok: false, error: "invalid-amount" });
  });
});

describe("ADT order transitions", () => {
  const orders = {
    draft,
    paid,
    refunded,
  } satisfies { [K in Order["kind"]]: Extract<Order, { kind: K }> };
  const events = {
    "payment-recorded": { type: "payment-recorded", paymentId: "pay-demo" },
    "refund-recorded": { type: "refund-recorded", refundId: "refund-demo" },
  } satisfies { [K in OrderEvent["type"]]: Extract<OrderEvent, { type: K }> };

  it.each(Object.values(orders).flatMap((order) =>
    Object.values(events).map((event) => ({ order, event })),
  ))(
    "matches the transition table for $order.kind + $event.type",
    ({ order, event }) => {
      const before = JSON.stringify(order);
      const result = applyOrderEvent(Object.freeze(order), event);
      const allowed =
        (order.kind === "draft" && event.type === "payment-recorded") ||
        (order.kind === "paid" && event.type === "refund-recorded");
      expect(result.ok).toBe(allowed);
      expect(JSON.stringify(order)).toBe(before);
      if (result.ok) {
        expect(result.value).toEqual(order.kind === "draft" ? paid : refunded);
        expect(result.value).not.toBe(order);
      } else {
        expect(result.error).toEqual({
          kind: "invalid-transition",
          state: order.kind,
          event: event.type,
        });
      }
    },
  );

  it("rejects empty references with an explicit result", () => {
    expect(applyOrderEvent(draft, { type: "payment-recorded", paymentId: " " }))
      .toEqual({
        ok: false,
        error: { kind: "invalid-reference", field: "paymentId" },
      });
    expect(applyOrderEvent(paid, { type: "refund-recorded", refundId: "" }))
      .toEqual({
        ok: false,
        error: { kind: "invalid-reference", field: "refundId" },
      });
  });

  it("preserves the payment ID when recording a refund", () => {
    expect(refunded).toEqual({
      kind: "refunded",
      orderId: "order-42",
      amountYen: 1200,
      paymentId: "pay-demo",
      refundId: "refund-demo",
    });
  });

  it("does not consume a draft: type-only typestate is not linear ownership", () => {
    expect(recordPayment(draft, "pay-a").paymentId).toBe("pay-a");
    expect(recordPayment(draft, "pay-b").paymentId).toBe("pay-b");
    expect(draft.kind).toBe("draft");
  });
});
