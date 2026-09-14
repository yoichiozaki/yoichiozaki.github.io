export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export type RemoteData<T, E> =
  | { readonly kind: "idle" }
  | { readonly kind: "loading" }
  | { readonly kind: "success"; readonly data: T }
  | { readonly kind: "failure"; readonly error: E };

export function assertNever(value: never): never {
  throw new Error(`Unexpected variant: ${String(value)}`);
}

export type LegacyRequest = {
  readonly isLoading: boolean;
  readonly data: string | null;
  readonly error: string | null;
};

export function classifyLegacyRequest(
  request: LegacyRequest,
): Result<RemoteData<string, string>, "loading-with-result" | "two-results"> {
  if (request.isLoading) {
    if (request.data !== null || request.error !== null) {
      return { ok: false, error: "loading-with-result" };
    }
    return { ok: true, value: { kind: "loading" } };
  }
  if (request.data !== null && request.error !== null) {
    return { ok: false, error: "two-results" };
  }
  if (request.data !== null) {
    return { ok: true, value: { kind: "success", data: request.data } };
  }
  if (request.error !== null) {
    return { ok: true, value: { kind: "failure", error: request.error } };
  }
  return { ok: true, value: { kind: "idle" } };
}

export const requestCombinations: readonly LegacyRequest[] =
  [false, true].flatMap((isLoading) =>
    [null, "order-42"].flatMap((data) =>
      [null, "NETWORK_ERROR"].map((error) => ({ isLoading, data, error })),
    ),
  );

export type ExhaustivenessMode = "base" | "extended" | "fixed" | "fallback";

export const exhaustivenessModes: readonly ExhaustivenessMode[] = [
  "base",
  "extended",
  "fixed",
  "fallback",
];

export function exhaustivenessSource(mode: ExhaustivenessMode): string {
  const extraType = mode === "base" ? "" : '\n  | { kind: "cancelled" }';
  const extraCase =
    mode === "fixed" ? '\n    case "cancelled": return "Cancelled";' : "";
  const fallback =
    mode === "fallback" ? '\n    default: return "Ready";' : "";
  const exhaustive =
    mode === "fallback" ? "" : "\n  return assertNever(state);";

  return `type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; data: string }
  | { kind: "failure"; error: string }${extraType};

function assertNever(value: never): never {
  throw new Error(\`Unexpected variant: \${String(value)}\`);
}

function label(state: State): string {
  switch (state.kind) {
    case "idle": return "Ready";
    case "loading": return "Loading";
    case "success": return state.data;
    case "failure": return state.error;${extraCase}${fallback}
  }${exhaustive}
}`;
}

export type OrderFields = {
  readonly orderId: string;
  readonly amountYen: number;
};

export type DraftOrder = OrderFields & {
  readonly kind: "draft";
};

export type PaidOrder = OrderFields & {
  readonly kind: "paid";
  readonly paymentId: string;
};

export type RefundedOrder = OrderFields & {
  readonly kind: "refunded";
  readonly paymentId: string;
  readonly refundId: string;
};

export type Order = DraftOrder | PaidOrder | RefundedOrder;

export type DecodeError =
  | "not-object"
  | "not-draft"
  | "invalid-order-id"
  | "invalid-amount";

export function decodeDraft(value: unknown): Result<DraftOrder, DecodeError> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ok: false, error: "not-object" };
  }
  if (!("kind" in value) || value.kind !== "draft") {
    return { ok: false, error: "not-draft" };
  }
  if (
    !("orderId" in value) ||
    typeof value.orderId !== "string" ||
    value.orderId.trim().length === 0
  ) {
    return { ok: false, error: "invalid-order-id" };
  }
  if (
    !("amountYen" in value) ||
    typeof value.amountYen !== "number" ||
    !Number.isSafeInteger(value.amountYen) ||
    value.amountYen <= 0
  ) {
    return { ok: false, error: "invalid-amount" };
  }
  return {
    ok: true,
    value: {
      kind: "draft",
      orderId: value.orderId,
      amountYen: value.amountYen,
    },
  };
}

export function parseDraftJson(
  source: string,
): Result<DraftOrder, DecodeError | "invalid-json"> {
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { ok: false, error: "invalid-json" };
    }
    throw error;
  }
  return decodeDraft(value);
}

export function recordPayment(
  order: DraftOrder,
  paymentId: string,
): PaidOrder {
  return {
    kind: "paid",
    orderId: order.orderId,
    amountYen: order.amountYen,
    paymentId,
  };
}

export function recordRefund(
  order: PaidOrder,
  refundId: string,
): RefundedOrder {
  return {
    kind: "refunded",
    orderId: order.orderId,
    amountYen: order.amountYen,
    paymentId: order.paymentId,
    refundId,
  };
}

export type OrderEvent =
  | { readonly type: "payment-recorded"; readonly paymentId: string }
  | { readonly type: "refund-recorded"; readonly refundId: string };

export type TransitionError =
  | {
      readonly kind: "invalid-transition";
      readonly state: Order["kind"];
      readonly event: OrderEvent["type"];
    }
  | {
      readonly kind: "invalid-reference";
      readonly field: "paymentId" | "refundId";
    };

export function applyOrderEvent(
  order: Order,
  event: OrderEvent,
): Result<Order, TransitionError> {
  switch (event.type) {
    case "payment-recorded":
      if (event.paymentId.trim().length === 0) {
        return {
          ok: false,
          error: { kind: "invalid-reference", field: "paymentId" },
        };
      }
      if (order.kind !== "draft") {
        return {
          ok: false,
          error: {
            kind: "invalid-transition",
            state: order.kind,
            event: event.type,
          },
        };
      }
      return { ok: true, value: recordPayment(order, event.paymentId) };
    case "refund-recorded":
      if (event.refundId.trim().length === 0) {
        return {
          ok: false,
          error: { kind: "invalid-reference", field: "refundId" },
        };
      }
      if (order.kind !== "paid") {
        return {
          ok: false,
          error: {
            kind: "invalid-transition",
            state: order.kind,
            event: event.type,
          },
        };
      }
      return { ok: true, value: recordRefund(order, event.refundId) };
  }
  return assertNever(event);
}

export const draftPresets = [
  {
    id: "valid",
    source: '{"kind":"draft","orderId":"order-42","amountYen":1200}',
  },
  {
    id: "zero",
    source: '{"kind":"draft","orderId":"order-42","amountYen":0}',
  },
  {
    id: "string",
    source: '{"kind":"draft","orderId":"order-42","amountYen":"1200"}',
  },
  {
    id: "missing",
    source: '{"kind":"draft","amountYen":1200}',
  },
  {
    id: "unknown",
    source: '{"kind":"reserved","orderId":"order-42","amountYen":1200}',
  },
  {
    id: "syntax",
    source: '{"kind":"draft",',
  },
] as const;
