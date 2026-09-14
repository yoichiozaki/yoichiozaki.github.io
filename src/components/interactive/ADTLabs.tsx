"use client";

import { useId, useState } from "react";
import messagesJa from "../../../messages/ja.json";
import messagesEn from "../../../messages/en.json";
import {
  applyOrderEvent,
  classifyLegacyRequest,
  draftPresets,
  exhaustivenessModes,
  exhaustivenessSource,
  parseDraftJson,
  requestCombinations,
  type DecodeError,
  type ExhaustivenessMode,
  type Order,
  type OrderEvent,
  type TransitionError,
} from "@/lib/algebraic-data-types";
import { InteractiveDemo } from "./InteractiveDemo";

type Props = { locale?: string };

const buttonClass =
  "rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const selectedClass = " border-accent bg-accent/10 font-semibold";
const goodClass =
  "rounded-lg border border-emerald-600/40 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-200";
const warningClass =
  "rounded-lg border border-amber-600/40 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200";

function messages(locale: string) {
  return locale === "en" ? messagesEn.adt : messagesJa.adt;
}

function CodePreview({ source, label }: { source: string; label: string }) {
  return (
    <pre
      aria-label={label}
      tabIndex={0}
      className="max-h-[32rem] overflow-auto rounded-lg border border-border bg-background p-3 text-xs leading-relaxed text-foreground focus-visible:outline-2 focus-visible:outline-accent sm:text-sm"
    >
      <code>{source}</code>
    </pre>
  );
}

export function ADTStateSpace({ locale = "ja" }: Props) {
  const t = messages(locale).stateSpace;
  const [request, setRequest] = useState(requestCombinations[0]);
  const result = classifyLegacyRequest(request);
  const validCount = requestCombinations.filter(
    (combination) => classifyLegacyRequest(combination).ok,
  ).length;

  return (
    <InteractiveDemo title={t.title} description={t.description}>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{t.rule}</p>
        <fieldset className="flex flex-wrap gap-4">
          <legend className="mb-2 text-sm font-semibold">{t.fields}</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={request.isLoading}
              onChange={(event) =>
                setRequest({ ...request, isLoading: event.target.checked })
              }
            />
            {t.loading}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={request.data !== null}
              onChange={(event) =>
                setRequest({
                  ...request,
                  data: event.target.checked ? "order-42" : null,
                })
              }
            />
            {t.data}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={request.error !== null}
              onChange={(event) =>
                setRequest({
                  ...request,
                  error: event.target.checked ? "NETWORK_ERROR" : null,
                })
              }
            />
            {t.error}
          </label>
        </fieldset>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="min-w-0 space-y-2">
            <h4 className="text-sm font-semibold">{t.legacy}</h4>
            <CodePreview
              source={JSON.stringify(request, null, 2)}
              label={t.legacy}
            />
          </div>
          <div className="min-w-0 space-y-2" aria-live="polite" aria-atomic="true">
            <h4 className="text-sm font-semibold">{t.union}</h4>
            {result.ok ? (
              <>
                <p className={goodClass}>{t.valid}</p>
                <CodePreview
                  source={JSON.stringify(result.value, null, 2)}
                  label={t.union}
                />
              </>
            ) : (
              <div className={warningClass}>
                <p className="font-semibold">{t.invalid}</p>
                <p className="mt-1">{t.reasons[result.error]}</p>
              </div>
            )}
          </div>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">
            {t.combinations} ({requestCombinations.length} / {validCount})
          </legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {requestCombinations.map((combination, index) => {
              const check = classifyLegacyRequest(combination);
              const selected =
                combination.isLoading === request.isLoading &&
                combination.data === request.data &&
                combination.error === request.error;
              return (
                <button
                  key={index}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setRequest(combination)}
                  className={buttonClass + (selected ? selectedClass : "")}
                >
                  <span className="block font-mono">
                    {Number(combination.isLoading)} /{" "}
                    {Number(combination.data !== null)} /{" "}
                    {Number(combination.error !== null)}
                  </span>
                  <span className="block text-xs">
                    {check.ok ? check.value.kind : t.invalidShort}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
        <p className="text-xs text-muted-foreground">{t.legend}</p>
      </div>
    </InteractiveDemo>
  );
}

export function ADTExhaustivenessLab({ locale = "ja" }: Props) {
  const t = messages(locale).exhaustiveness;
  const [mode, setMode] = useState<ExhaustivenessMode>("base");

  return (
    <InteractiveDemo title={t.title} description={t.description}>
      <div className="space-y-4">
        <fieldset className="flex flex-wrap gap-2">
          <legend className="mb-2 text-sm font-semibold">{t.choose}</legend>
          {exhaustivenessModes.map((example) => (
            <button
              type="button"
              key={example}
              aria-pressed={example === mode}
              onClick={() => setMode(example)}
              className={buttonClass + (example === mode ? selectedClass : "")}
            >
              {t.modes[example]}
            </button>
          ))}
        </fieldset>
        <div aria-live="polite" aria-atomic="true">
          <p className={mode === "base" || mode === "fixed" ? goodClass : warningClass}>
            {t.results[mode]}
          </p>
        </div>
        <CodePreview source={exhaustivenessSource(mode)} label={t.source} />
        <p className="text-xs text-muted-foreground">{t.disclaimer}</p>
      </div>
    </InteractiveDemo>
  );
}

type BoundaryFeedback =
  | { readonly kind: "ready" }
  | { readonly kind: "loaded" }
  | {
      readonly kind: "decoded-error";
      readonly error: DecodeError | "invalid-json";
    }
  | { readonly kind: "transitioned" }
  | { readonly kind: "transition-error"; readonly error: TransitionError };

export function ADTBoundaryLab({ locale = "ja" }: Props) {
  const t = messages(locale).boundary;
  const inputId = useId();
  const [source, setSource] = useState<string>(draftPresets[0].source);
  const [order, setOrder] = useState<Order>({
    kind: "draft",
    orderId: "order-42",
    amountYen: 1200,
  });
  const [feedback, setFeedback] = useState<BoundaryFeedback>({ kind: "ready" });

  function loadDraft() {
    const decoded = parseDraftJson(source);
    if (!decoded.ok) {
      setFeedback({
        kind: "decoded-error",
        error: decoded.error,
      });
      return;
    }
    setOrder(decoded.value);
    setFeedback({ kind: "loaded" });
  }

  function dispatch(event: OrderEvent) {
    const result = applyOrderEvent(order, event);
    if (!result.ok) {
      setFeedback({ kind: "transition-error", error: result.error });
      return;
    }
    setOrder(result.value);
    setFeedback({ kind: "transitioned" });
  }

  const failed =
    feedback.kind === "decoded-error" || feedback.kind === "transition-error";
  let feedbackText: string;
  switch (feedback.kind) {
    case "ready":
      feedbackText = t.ready;
      break;
    case "loaded":
      feedbackText = t.loaded;
      break;
    case "decoded-error":
      feedbackText = `${t.rejected} ${t.errors[feedback.error]}`;
      break;
    case "transitioned":
      feedbackText = `${t.transitioned} ${t.stateNames[order.kind]} (${order.kind})`;
      break;
    case "transition-error":
      feedbackText =
        feedback.error.kind === "invalid-transition"
          ? `${t.transitionRejected} ${feedback.error.state} + ${feedback.error.event}`
          : `${t.referenceRejected} ${feedback.error.field}`;
      break;
  }

  return (
    <InteractiveDemo title={t.title} description={t.description}>
      <div className="space-y-4">
        <fieldset className="flex flex-wrap gap-2">
          <legend className="mb-2 text-sm font-semibold">{t.presetsLabel}</legend>
          {draftPresets.map((preset) => (
            <button
              type="button"
              key={preset.id}
              onClick={() => {
                setSource(preset.source);
                setFeedback({ kind: "ready" });
              }}
              className={buttonClass}
            >
              {t.presets[preset.id]}
            </button>
          ))}
        </fieldset>
        <div className="grid items-start gap-4 md:grid-cols-2">
          <div className="min-w-0 space-y-2">
            <label htmlFor={inputId} className="block text-sm font-semibold">
              {t.input}
            </label>
            <textarea
              id={inputId}
              value={source}
              rows={6}
              spellCheck={false}
              onChange={(event) => {
                setSource(event.target.value);
                setFeedback({ kind: "ready" });
              }}
              className="w-full rounded-lg border border-border bg-background p-3 font-mono text-sm text-foreground focus-visible:outline-2 focus-visible:outline-accent"
            />
            <button type="button" onClick={loadDraft} className={buttonClass}>
              {t.load}
            </button>
            <p className="text-xs text-muted-foreground">{t.reloadNote}</p>
          </div>
          <div className="min-w-0 space-y-3">
            <h4 className="text-sm font-semibold">{t.current}</h4>
            <ol className="flex flex-wrap gap-2 text-sm" aria-label={t.statesLabel}>
              {(["draft", "paid", "refunded"] as const).map((state) => (
                <li
                  key={state}
                  aria-current={order.kind === state ? "step" : undefined}
                  className={
                    "rounded-lg border border-border px-3 py-2" +
                    (order.kind === state ? selectedClass : "")
                  }
                >
                  {state}
                </li>
              ))}
            </ol>
            <CodePreview source={JSON.stringify(order, null, 2)} label={t.current} />
            <p className="text-xs text-muted-foreground">{t.amountNote}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={buttonClass}
                onClick={() =>
                  dispatch({ type: "payment-recorded", paymentId: "pay-demo" })
                }
              >
                {t.pay}
              </button>
              <button
                type="button"
                className={buttonClass}
                onClick={() =>
                  dispatch({ type: "refund-recorded", refundId: "refund-demo" })
                }
              >
                {t.refund}
              </button>
            </div>
          </div>
        </div>
        <div aria-live="polite" aria-atomic="true">
          <p className={failed ? warningClass : goodClass}>{feedbackText}</p>
        </div>
        <p className="text-xs text-muted-foreground">{t.disclaimer}</p>
      </div>
    </InteractiveDemo>
  );
}

export function ADTExtensionMatrix({ locale = "ja" }: Props) {
  const t = messages(locale).extension;
  const [change, setChange] = useState<"case" | "operation">("case");
  const states = change === "case"
    ? ["draft", "paid", "refunded", "cancelled"]
    : ["draft", "paid", "refunded"];
  const operations = change === "operation"
    ? ["label", "toDto", "audit"]
    : ["label", "toDto"];

  return (
    <InteractiveDemo title={t.title} description={t.description}>
      <div className="space-y-4">
        <fieldset className="flex flex-wrap gap-2">
          <legend className="mb-2 text-sm font-semibold">{t.choose}</legend>
          {(["case", "operation"] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={buttonClass + (change === option ? selectedClass : "")}
              aria-pressed={change === option}
              onClick={() => setChange(option)}
            >
              {t.changes[option]}
            </button>
          ))}
        </fieldset>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <caption className="mb-2 text-left text-xs text-muted-foreground">
              {t.caption}
            </caption>
            <thead>
              <tr>
                <th scope="col" className="border border-border p-2">{t.caseLabel}</th>
                {operations.map((operation) => (
                  <th scope="col" key={operation} className="border border-border p-2 font-mono">
                    {operation}()
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {states.map((state) => (
                <tr key={state}>
                  <th scope="row" className="border border-border p-2 font-mono">{state}</th>
                  {operations.map((operation) => {
                    const added = state === "cancelled" || operation === "audit";
                    return (
                      <td
                        key={operation}
                        className={
                          "border border-border p-2" +
                          (added ? " bg-accent/10 font-semibold text-accent" : " text-muted-foreground")
                        }
                      >
                        {added ? t.added : t.existing}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid gap-3 text-sm md:grid-cols-2" aria-live="polite">
          <div className="rounded-lg border border-border p-3">
            <h4 className="mb-2 font-semibold">{t.unionTitle}</h4>
            <p>{t.union[change]}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <h4 className="mb-2 font-semibold">{t.classesTitle}</h4>
            <p>{t.classes[change]}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{t.caveat}</p>
      </div>
    </InteractiveDemo>
  );
}
